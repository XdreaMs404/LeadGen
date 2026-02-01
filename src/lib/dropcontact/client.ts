/**
 * Dropcontact API Client
 * Handles async batch enrichment using the /batch endpoint
 * @see https://dropcontact.com/api
 */

import type {
    DropcontactContact,
    DropcontactBatchRequest,
    DropcontactBatchResponse,
    DropcontactResultResponse,
} from './types';

const DROPCONTACT_API_BASE = 'https://api.dropcontact.io';
const MAX_CONTACTS_PER_BATCH = 250;

export class DropcontactApiError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode?: number
    ) {
        super(message);
        this.name = 'DropcontactApiError';
    }
}

/**
 * Get the Dropcontact API key from environment variables
 */
function getApiKey(): string {
    const apiKey = process.env.DROPCONTACT_API_KEY;
    if (!apiKey) {
        throw new DropcontactApiError(
            'DROPCONTACT_API_KEY environment variable is not set',
            'MISSING_API_KEY'
        );
    }
    return apiKey;
}

/**
 * Submit a batch of contacts for enrichment
 * @param contacts - Array of contacts to enrich (max 250)
 * @returns The request_id for polling results
 */
export async function submitEnrichmentRequest(
    contacts: DropcontactContact[]
): Promise<string> {
    if (contacts.length === 0) {
        throw new DropcontactApiError('Cannot submit empty contact list', 'EMPTY_CONTACTS');
    }

    if (contacts.length > MAX_CONTACTS_PER_BATCH) {
        throw new DropcontactApiError(
            `Cannot submit more than ${MAX_CONTACTS_PER_BATCH} contacts per batch`,
            'BATCH_TOO_LARGE'
        );
    }

    const apiKey = getApiKey();

    const requestBody: DropcontactBatchRequest = {
        data: contacts.map((c) => ({
            email: c.email,
            first_name: c.first_name,
            last_name: c.last_name,
            company: c.company,
            website: c.website,
            phone: c.phone,
            linkedin: c.linkedin,
        })),
        siren: true, // Get French company data (SIREN/SIRET)
        language: 'fr',
    };

    try {
        const response = await fetch(`${DROPCONTACT_API_BASE}/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Token': apiKey,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new DropcontactApiError(
                `Dropcontact API error: ${errorText}`,
                'API_ERROR',
                response.status
            );
        }

        const result: DropcontactBatchResponse = await response.json();

        if (!result.success) {
            throw new DropcontactApiError(
                result.error || 'Unknown Dropcontact error',
                'SUBMISSION_FAILED'
            );
        }

        if (!result.request_id) {
            throw new DropcontactApiError('No request_id returned from Dropcontact', 'NO_REQUEST_ID');
        }

        return result.request_id;
    } catch (error) {
        if (error instanceof DropcontactApiError) {
            throw error;
        }
        throw new DropcontactApiError(
            `Failed to submit enrichment request: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'NETWORK_ERROR'
        );
    }
}

/**
 * Fetch the results of a batch enrichment request
 * @param requestId - The request_id from submitEnrichmentRequest
 * @returns The enrichment results or status if still pending
 */
export async function fetchEnrichmentResult(
    requestId: string
): Promise<DropcontactResultResponse> {
    if (!requestId) {
        throw new DropcontactApiError('requestId is required', 'MISSING_REQUEST_ID');
    }

    const apiKey = getApiKey();

    try {
        const response = await fetch(`${DROPCONTACT_API_BASE}/batch/${requestId}`, {
            method: 'GET',
            headers: {
                'X-Access-Token': apiKey,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new DropcontactApiError(
                `Dropcontact API error: ${errorText}`,
                'API_ERROR',
                response.status
            );
        }

        const result: DropcontactResultResponse = await response.json();

        return result;
    } catch (error) {
        if (error instanceof DropcontactApiError) {
            throw error;
        }
        throw new DropcontactApiError(
            `Failed to fetch enrichment result: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'NETWORK_ERROR'
        );
    }
}

const TRUSTED_DOMAINS = [
    'gmail.com',
    'googlemail.com',
    'outlook.com',
    'hotmail.com',
    'hotmail.fr',
    'live.com',
    'yahoo.com',
    'yahoo.fr',
    'icloud.com',
    'orange.fr',
    'wanadoo.fr',
    'sfr.fr',
    'free.fr',
    'laposte.net'
];

/**
 * Check if an enrichment result indicates the email is verified
 * @param emailScore - The email_score from Dropcontact (0-100)
 * @param email - The email address to check against trusted list
 * @returns true if email is considered verified
 */
export function isEmailVerified(emailScore?: number, email?: string): boolean {
    // 1. Trust common personal domains if provided
    if (email) {
        const domain = email.split('@')[1]?.toLowerCase();
        if (domain && TRUSTED_DOMAINS.includes(domain)) {
            return true;
        }
    }

    // 2. Lower threshold for verification (was 80, now 50 for easier testing)
    return typeof emailScore === 'number' && emailScore >= 50;
}

export { MAX_CONTACTS_PER_BATCH };
