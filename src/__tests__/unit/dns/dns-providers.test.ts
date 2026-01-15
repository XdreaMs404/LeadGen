import { describe, it, expect } from 'vitest';
import { extractDomainFromEmail, getDmarcRecord, SPF_RECORD, DKIM_SELECTOR_DEFAULT, DNS_PROVIDERS } from '@/lib/constants/dns-providers';

describe('dns-providers constants', () => {
    describe('SPF_RECORD', () => {
        it('should be the correct Google Workspace SPF record', () => {
            expect(SPF_RECORD).toBe('v=spf1 include:_spf.google.com ~all');
        });
    });

    describe('DKIM_SELECTOR_DEFAULT', () => {
        it('should be google as the default selector', () => {
            expect(DKIM_SELECTOR_DEFAULT).toBe('google');
        });
    });

    describe('DNS_PROVIDERS', () => {
        it('should include major DNS providers', () => {
            const providerNames = DNS_PROVIDERS.map((p) => p.name);
            expect(providerNames).toContain('Cloudflare');
            expect(providerNames).toContain('GoDaddy');
            expect(providerNames).toContain('OVH');
            expect(providerNames).toContain('Namecheap');
        });

        it('should have valid docs URLs for all providers', () => {
            DNS_PROVIDERS.forEach((provider) => {
                expect(provider.docsUrl).toMatch(/^https:\/\//);
            });
        });
    });

    describe('extractDomainFromEmail', () => {
        it('should extract domain from valid email', () => {
            expect(extractDomainFromEmail('user@example.com')).toBe('example.com');
        });

        it('should handle subdomain emails', () => {
            expect(extractDomainFromEmail('user@mail.example.com')).toBe('mail.example.com');
        });

        it('should return null for invalid email without @', () => {
            expect(extractDomainFromEmail('invalid-email')).toBeNull();
        });

        it('should return null for email with multiple @', () => {
            expect(extractDomainFromEmail('user@domain@example.com')).toBeNull();
        });

        it('should handle empty string', () => {
            expect(extractDomainFromEmail('')).toBeNull();
        });
    });

    describe('getDmarcRecord', () => {
        it('should generate correct DMARC record for domain', () => {
            const record = getDmarcRecord('example.com');
            expect(record).toBe('v=DMARC1; p=none; rua=mailto:dmarc@example.com');
        });

        it('should include domain in rua address', () => {
            const record = getDmarcRecord('mycompany.fr');
            expect(record).toContain('rua=mailto:dmarc@mycompany.fr');
        });

        it('should use policy none', () => {
            const record = getDmarcRecord('test.com');
            expect(record).toContain('p=none');
        });
    });
});
