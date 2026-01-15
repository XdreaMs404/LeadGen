/**
 * DNS Validation Service
 *
 * Uses Node.js dns.promises for DNS lookups to validate SPF, DKIM, and DMARC records.
 * All functions return structured DnsValidationResult - never throw errors.
 */

import dns from 'dns/promises';
import type { DnsValidationResult } from '@/types/dns';
import { DNS_ERROR_MESSAGES } from './dns-constants';

const DNS_TIMEOUT_MS = 10_000;

/**
 * Race a promise against a timeout
 */
async function withTimeout<T>(
    promise: Promise<T>,
    ms: number
): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DNS_TIMEOUT')), ms)
    );
    return Promise.race([promise, timeout]);
}

/**
 * Handle DNS errors and return appropriate DnsValidationResult
 */
function handleDnsError(error: unknown, recordType: string): DnsValidationResult {
    const code = (error as NodeJS.ErrnoException).code;
    const message = (error as Error).message;

    // Check for timeout
    if (message === 'DNS_TIMEOUT') {
        return {
            status: 'UNKNOWN',
            message: DNS_ERROR_MESSAGES.TIMEOUT,
            error: 'DNS_TIMEOUT',
        };
    }

    switch (code) {
        case 'ENOTFOUND':
        case 'ENODATA':
            return {
                status: 'FAIL',
                message: DNS_ERROR_MESSAGES.NOT_FOUND(recordType),
                error: `${recordType}_NOT_FOUND`,
            };
        case 'SERVFAIL':
            return {
                status: 'UNKNOWN',
                message: DNS_ERROR_MESSAGES.SERVER_ERROR,
                error: 'DNS_SERVFAIL',
            };
        default:
            return {
                status: 'UNKNOWN',
                message: DNS_ERROR_MESSAGES.UNKNOWN_ERROR,
                error: 'DNS_ERROR',
            };
    }
}

/**
 * Validate SPF record for a domain
 *
 * Checks for:
 * 1. TXT record starting with "v=spf1"
 * 2. Presence of "include:_spf.google.com" for Google Workspace
 */
export async function validateSpf(domain: string): Promise<DnsValidationResult> {
    console.log(`[DNS] Validating SPF for domain: ${domain}`);

    try {
        const records = await withTimeout(
            dns.resolveTxt(domain),
            DNS_TIMEOUT_MS
        );

        // Flatten TXT records (they can be split across multiple strings)
        const flatRecords = records.map((r) => r.join(''));
        const spfRecord = flatRecords.find((r) => r.startsWith('v=spf1'));

        if (!spfRecord) {
            return {
                status: 'FAIL',
                message: DNS_ERROR_MESSAGES.SPF_NOT_FOUND,
                error: 'SPF_NOT_FOUND',
            };
        }

        if (!spfRecord.includes('include:_spf.google.com')) {
            return {
                status: 'FAIL',
                message: DNS_ERROR_MESSAGES.SPF_MISSING_GOOGLE,
                rawRecord: spfRecord,
                error: 'SPF_MISSING_GOOGLE',
            };
        }

        console.log(`[DNS] SPF validation PASS for ${domain}`);
        return {
            status: 'PASS',
            message: DNS_ERROR_MESSAGES.SPF_SUCCESS,
            rawRecord: spfRecord,
        };
    } catch (error) {
        console.error(`[DNS] SPF validation error for ${domain}:`, error);
        return handleDnsError(error, 'SPF');
    }
}

/**
 * Validate DKIM record for a domain with a specific selector
 *
 * Looks up {selector}._domainkey.{domain} TXT record
 * For Google Workspace, default selector is "google"
 */
export async function validateDkim(
    domain: string,
    selector: string = 'google'
): Promise<DnsValidationResult> {
    const dkimDomain = `${selector}._domainkey.${domain}`;
    console.log(`[DNS] Validating DKIM for: ${dkimDomain}`);

    try {
        const records = await withTimeout(
            dns.resolveTxt(dkimDomain),
            DNS_TIMEOUT_MS
        );

        if (!records || records.length === 0) {
            return {
                status: 'FAIL',
                message: DNS_ERROR_MESSAGES.DKIM_NOT_FOUND(selector),
                error: 'DKIM_NOT_FOUND',
            };
        }

        // Any TXT record found at DKIM domain = configured
        const dkimRecord = records.map((r) => r.join('')).join('');

        console.log(`[DNS] DKIM validation PASS for ${dkimDomain}`);
        return {
            status: 'PASS',
            message: DNS_ERROR_MESSAGES.DKIM_SUCCESS,
            rawRecord: dkimRecord.substring(0, 100) + (dkimRecord.length > 100 ? '...' : ''),
        };
    } catch (error) {
        console.error(`[DNS] DKIM validation error for ${dkimDomain}:`, error);

        const errorResult = handleDnsError(error, 'DKIM');
        // Provide better message for DKIM selector not found
        if (errorResult.status === 'FAIL') {
            errorResult.message = DNS_ERROR_MESSAGES.DKIM_NOT_FOUND(selector);
        }
        return errorResult;
    }
}

/**
 * Validate DMARC record for a domain
 *
 * Looks up _dmarc.{domain} TXT record
 * Checks for "v=DMARC1" at the start
 */
export async function validateDmarc(domain: string): Promise<DnsValidationResult> {
    const dmarcDomain = `_dmarc.${domain}`;
    console.log(`[DNS] Validating DMARC for: ${dmarcDomain}`);

    try {
        const records = await withTimeout(
            dns.resolveTxt(dmarcDomain),
            DNS_TIMEOUT_MS
        );

        const flatRecords = records.map((r) => r.join(''));
        const dmarcRecord = flatRecords.find((r) => r.startsWith('v=DMARC1'));

        if (!dmarcRecord) {
            return {
                status: 'FAIL',
                message: DNS_ERROR_MESSAGES.DMARC_NOT_FOUND,
                error: 'DMARC_NOT_FOUND',
            };
        }

        console.log(`[DNS] DMARC validation PASS for ${domain}`);
        return {
            status: 'PASS',
            message: DNS_ERROR_MESSAGES.DMARC_SUCCESS,
            rawRecord: dmarcRecord,
        };
    } catch (error) {
        console.error(`[DNS] DMARC validation error for ${dmarcDomain}:`, error);
        return handleDnsError(error, 'DMARC');
    }
}

/**
 * Validate all DNS records in parallel
 */
export async function validateAllDns(
    domain: string,
    dkimSelector: string = 'google'
): Promise<{
    spf: DnsValidationResult;
    dkim: DnsValidationResult;
    dmarc: DnsValidationResult;
}> {
    console.log(`[DNS] Validating all records for domain: ${domain}, selector: ${dkimSelector}`);

    const [spf, dkim, dmarc] = await Promise.all([
        validateSpf(domain),
        validateDkim(domain, dkimSelector),
        validateDmarc(domain),
    ]);

    return { spf, dkim, dmarc };
}
