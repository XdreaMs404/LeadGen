/**
 * Dropcontact API Types
 * @see https://dropcontact.com/api
 */

// Request types
export interface DropcontactContact {
    email?: string;
    first_name?: string;
    last_name?: string;
    company?: string;
    website?: string;
    phone?: string;
    linkedin?: string;
}

export interface DropcontactBatchRequest {
    data: DropcontactContact[];
    siren?: boolean;
    language?: 'fr' | 'en';
}

// Response types
export type DropcontactBatchStatus = 'pending' | 'done' | 'error';

export interface DropcontactBatchResponse {
    request_id: string;
    success: boolean;
    error?: string;
    credits_left?: number;
}

export interface DropcontactEnrichedContact {
    email?: string | null;
    email_score?: number;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    company?: string | null;
    job_title?: string | null;
    linkedin?: string | null;
    phone?: string | null;
    mobile?: string | null;
    siren?: string | null;
    siret?: string | null;
    vat?: string | null;
    city?: string | null;
    country?: string | null;
    website?: string | null;
    company_size?: string | null;
    company_industry?: string | null;
    company_linkedin?: string | null;
}

export interface DropcontactResultResponse {
    request_id: string;
    status: DropcontactBatchStatus;
    success: boolean;
    error?: string;
    data?: DropcontactEnrichedContact[];
    credits_left?: number;
}

// Enrichment data stored in prospect.enrichmentData
export interface ProspectEnrichmentData {
    dropcontact: DropcontactEnrichedContact;
    rawResponse?: Record<string, unknown>;
}
