/**
 * Unit Tests: Dropcontact Client
 * Story 3.5: Dropcontact Enrichment Integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    submitEnrichmentRequest,
    fetchEnrichmentResult,
    isEmailVerified,
    DropcontactApiError,
    MAX_CONTACTS_PER_BATCH,
} from '@/lib/dropcontact/client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Dropcontact Client', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        process.env.DROPCONTACT_API_KEY = 'test-api-key';
    });

    afterEach(() => {
        delete process.env.DROPCONTACT_API_KEY;
    });

    describe('submitEnrichmentRequest', () => {
        it('should submit contacts and return request_id', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    request_id: 'req-123',
                    credits_left: 100,
                }),
            });

            const requestId = await submitEnrichmentRequest([
                { email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
            ]);

            expect(requestId).toBe('req-123');
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.dropcontact.io/batch',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'X-Access-Token': 'test-api-key',
                    }),
                })
            );
        });

        it('should throw error for empty contact list', async () => {
            await expect(submitEnrichmentRequest([])).rejects.toThrow(
                DropcontactApiError
            );
        });

        it('should throw error for too many contacts', async () => {
            const contacts = Array(MAX_CONTACTS_PER_BATCH + 1).fill({
                email: 'test@example.com',
            });

            await expect(submitEnrichmentRequest(contacts)).rejects.toThrow(
                'Cannot submit more than'
            );
        });

        it('should throw error when API key is missing', async () => {
            delete process.env.DROPCONTACT_API_KEY;

            await expect(
                submitEnrichmentRequest([{ email: 'test@example.com' }])
            ).rejects.toThrow('DROPCONTACT_API_KEY');
        });

        it('should throw error on API failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: () => Promise.resolve('Internal Server Error'),
            });

            await expect(
                submitEnrichmentRequest([{ email: 'test@example.com' }])
            ).rejects.toThrow(DropcontactApiError);
        });

        it('should throw error when success is false', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Invalid request',
                }),
            });

            await expect(
                submitEnrichmentRequest([{ email: 'test@example.com' }])
            ).rejects.toThrow('Invalid request');
        });
    });

    describe('fetchEnrichmentResult', () => {
        it('should fetch pending result', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    request_id: 'req-123',
                    status: 'pending',
                    success: true,
                }),
            });

            const result = await fetchEnrichmentResult('req-123');

            expect(result.status).toBe('pending');
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.dropcontact.io/batch/req-123',
                expect.objectContaining({
                    method: 'GET',
                })
            );
        });

        it('should fetch completed result with data', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    request_id: 'req-123',
                    status: 'done',
                    success: true,
                    data: [
                        {
                            email: 'verified@example.com',
                            email_score: 95,
                            company: 'Acme Inc',
                        },
                    ],
                }),
            });

            const result = await fetchEnrichmentResult('req-123');

            expect(result.status).toBe('done');
            expect(result.data).toHaveLength(1);
            expect(result.data?.[0].email_score).toBe(95);
        });

        it('should throw error for missing requestId', async () => {
            await expect(fetchEnrichmentResult('')).rejects.toThrow(
                'requestId is required'
            );
        });
    });

    describe('isEmailVerified', () => {
        it('should return true for score >= 50', () => {
            expect(isEmailVerified(50)).toBe(true);
            expect(isEmailVerified(95)).toBe(true);
            expect(isEmailVerified(100)).toBe(true);
        });

        it('should return false for score < 50 on non-trusted domains', () => {
            expect(isEmailVerified(49, 'lead@company.com')).toBe(false);
            expect(isEmailVerified(0, 'lead@company.com')).toBe(false);
        });

        it('should trust known personal email domains', () => {
            expect(isEmailVerified(undefined, 'user@gmail.com')).toBe(true);
            expect(isEmailVerified(10, 'user@outlook.com')).toBe(true);
        });

        it('should return true for scores above threshold even without email', () => {
            expect(isEmailVerified(79)).toBe(true);
            expect(isEmailVerified(0)).toBe(false);
        });

        it('should return false for undefined score', () => {
            expect(isEmailVerified(undefined)).toBe(false);
        });
    });
});
