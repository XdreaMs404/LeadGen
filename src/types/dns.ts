import type { DnsStatus as PrismaDnsStatus } from '@prisma/client';

// Re-export Prisma enum for use in components
export type DnsStatus = PrismaDnsStatus;

// DNS Status response from API
export interface DnsStatusResponse {
    spfStatus: DnsStatus;
    dkimStatus: DnsStatus;
    dmarcStatus: DnsStatus;
    dkimSelector: string | null;
    domain: string | null;
}

// DNS Step configuration for UI
export interface DnsStep {
    id: 'spf' | 'dkim' | 'dmarc';
    label: string;
    status: DnsStatus;
}

// DNS Provider for documentation links
export interface DnsProvider {
    name: string;
    slug: string;
    docsUrl: string;
    logo?: string;
}

// DNS Validation Result from validation service
export interface DnsValidationResult {
    status: 'PASS' | 'FAIL' | 'UNKNOWN';
    message?: string;
    rawRecord?: string;
    error?: string;
}
