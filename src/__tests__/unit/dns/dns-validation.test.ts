/**
 * DNS Validation Service Unit Tests
 *
 * Tests for SPF, DKIM, and DMARC validation logic.
 * Uses mocked dns.promises.resolveTxt to simulate DNS responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import dns from 'dns/promises';
import { validateSpf, validateDkim, validateDmarc, validateAllDns } from '@/lib/dns/dns-validation';

// Mock dns module
vi.mock('dns/promises', () => ({
    default: {
        resolveTxt: vi.fn(),
    },
}));

const mockResolveTxt = dns.resolveTxt as ReturnType<typeof vi.fn>;

describe('DNS Validation Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('validateSpf', () => {
        it('returns PASS for valid SPF with Google Workspace include', async () => {
            mockResolveTxt.mockResolvedValue([
                ['v=spf1 include:_spf.google.com ~all'],
            ]);

            const result = await validateSpf('example.com');

            expect(result.status).toBe('PASS');
            expect(result.message).toContain('configuré correctement');
            expect(result.rawRecord).toContain('v=spf1');
        });

        it('returns FAIL when SPF record is missing', async () => {
            mockResolveTxt.mockResolvedValue([
                ['some-other-record=value'],
            ]);

            const result = await validateSpf('example.com');

            expect(result.status).toBe('FAIL');
            expect(result.message).toContain('Aucun enregistrement SPF');
        });

        it('returns FAIL when SPF exists but Google include is missing', async () => {
            mockResolveTxt.mockResolvedValue([
                ['v=spf1 include:_spf.otherprovider.com ~all'],
            ]);

            const result = await validateSpf('example.com');

            expect(result.status).toBe('FAIL');
            expect(result.message).toContain('ne contient pas Google');
            expect(result.rawRecord).toBeDefined();
        });

        it('returns FAIL for ENOTFOUND error (no TXT records)', async () => {
            const error = new Error('DNS lookup failed') as NodeJS.ErrnoException;
            error.code = 'ENOTFOUND';
            mockResolveTxt.mockRejectedValue(error);

            const result = await validateSpf('example.com');

            expect(result.status).toBe('FAIL');
            expect(result.error).toContain('NOT_FOUND');
        });

        it('returns UNKNOWN for SERVFAIL error', async () => {
            const error = new Error('DNS server error') as NodeJS.ErrnoException;
            error.code = 'SERVFAIL';
            mockResolveTxt.mockRejectedValue(error);

            const result = await validateSpf('example.com');

            expect(result.status).toBe('UNKNOWN');
        });

        it('handles split TXT records (multiple strings)', async () => {
            // Long SPF records are split across multiple strings
            mockResolveTxt.mockResolvedValue([
                ['v=spf1 include:_spf.google.com ', 'include:other.com ~all'],
            ]);

            const result = await validateSpf('example.com');

            expect(result.status).toBe('PASS');
        });
    });

    describe('validateDkim', () => {
        it('returns PASS when DKIM record exists', async () => {
            mockResolveTxt.mockResolvedValue([
                ['v=DKIM1; k=rsa; p=MIGfMA0GCSqGS...'],
            ]);

            const result = await validateDkim('example.com', 'google');

            expect(result.status).toBe('PASS');
            expect(result.message).toContain('configuré correctement');
            expect(mockResolveTxt).toHaveBeenCalledWith('google._domainkey.example.com');
        });

        it('uses default selector "google" when not specified', async () => {
            mockResolveTxt.mockResolvedValue([
                ['v=DKIM1; k=rsa; p=...'],
            ]);

            await validateDkim('example.com');

            expect(mockResolveTxt).toHaveBeenCalledWith('google._domainkey.example.com');
        });

        it('uses custom selector when provided', async () => {
            mockResolveTxt.mockResolvedValue([
                ['v=DKIM1; k=rsa; p=...'],
            ]);

            await validateDkim('example.com', 'customselector');

            expect(mockResolveTxt).toHaveBeenCalledWith('customselector._domainkey.example.com');
        });

        it('returns FAIL when DKIM selector not found', async () => {
            const error = new Error('DNS lookup failed') as NodeJS.ErrnoException;
            error.code = 'ENOTFOUND';
            mockResolveTxt.mockRejectedValue(error);

            const result = await validateDkim('example.com', 'wrongselector');

            expect(result.status).toBe('FAIL');
            expect(result.message).toContain('wrongselector');
        });

        it('truncates long DKIM records in response', async () => {
            const longRecord = 'v=DKIM1; k=rsa; p=' + 'A'.repeat(200);
            mockResolveTxt.mockResolvedValue([[longRecord]]);

            const result = await validateDkim('example.com');

            expect(result.status).toBe('PASS');
            expect(result.rawRecord!.length).toBeLessThanOrEqual(103); // 100 + "..."
        });
    });

    describe('validateDmarc', () => {
        it('returns PASS for valid DMARC record', async () => {
            mockResolveTxt.mockResolvedValue([
                ['v=DMARC1; p=none; rua=mailto:dmarc@example.com'],
            ]);

            const result = await validateDmarc('example.com');

            expect(result.status).toBe('PASS');
            expect(result.message).toContain('configuré correctement');
            expect(mockResolveTxt).toHaveBeenCalledWith('_dmarc.example.com');
        });

        it('returns FAIL when DMARC record is missing', async () => {
            mockResolveTxt.mockResolvedValue([
                ['some-other-record=value'],
            ]);

            const result = await validateDmarc('example.com');

            expect(result.status).toBe('FAIL');
            expect(result.message).toContain('Aucun enregistrement DMARC');
        });

        it('returns FAIL for ENODATA error', async () => {
            const error = new Error('No data') as NodeJS.ErrnoException;
            error.code = 'ENODATA';
            mockResolveTxt.mockRejectedValue(error);

            const result = await validateDmarc('example.com');

            expect(result.status).toBe('FAIL');
        });
    });

    describe('validateAllDns', () => {
        it('validates all records in parallel', async () => {
            // Mock different responses for each lookup
            mockResolveTxt
                .mockImplementation((host: string) => {
                    if (host === 'example.com') {
                        return Promise.resolve([['v=spf1 include:_spf.google.com ~all']]);
                    }
                    if (host.includes('_domainkey')) {
                        return Promise.resolve([['v=DKIM1; k=rsa; p=...']]);
                    }
                    if (host.includes('_dmarc')) {
                        return Promise.resolve([['v=DMARC1; p=none']]);
                    }
                    return Promise.reject(new Error('Unknown host'));
                });

            const result = await validateAllDns('example.com', 'google');

            expect(result.spf.status).toBe('PASS');
            expect(result.dkim.status).toBe('PASS');
            expect(result.dmarc.status).toBe('PASS');
        });

        it('returns mixed results when some validations fail', async () => {
            mockResolveTxt
                .mockImplementation((host: string) => {
                    if (host === 'example.com') {
                        return Promise.resolve([['v=spf1 include:_spf.google.com ~all']]);
                    }
                    if (host.includes('_domainkey')) {
                        const error = new Error('Not found') as NodeJS.ErrnoException;
                        error.code = 'ENOTFOUND';
                        return Promise.reject(error);
                    }
                    if (host.includes('_dmarc')) {
                        return Promise.resolve([['v=DMARC1; p=none']]);
                    }
                    return Promise.reject(new Error('Unknown host'));
                });

            const result = await validateAllDns('example.com', 'google');

            expect(result.spf.status).toBe('PASS');
            expect(result.dkim.status).toBe('FAIL');
            expect(result.dmarc.status).toBe('PASS');
        });
    });
});
