/**
 * Gmail Inbox Sync Service (Story 6.1)
 * 
 * Fetches new messages from Gmail API for inbox sync
 */

import {
    extractEmailAddress,
    extractBodyFromMimePart,
    decodeBase64Url
} from '@/lib/utils/email-body-parser';
import type { GmailMessage, GmailMessageDetails } from '@/types/inbox';
import { GmailSendError, GMAIL_RETRYABLE_ERRORS } from './sender';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

/**
 * Gmail API messages list response
 */
interface GmailListResponse {
    messages?: Array<{ id: string; threadId: string }>;
    nextPageToken?: string;
    resultSizeEstimate: number;
}

/**
 * Gmail message payload structure
 */
interface GmailPayload {
    headers: Array<{ name: string; value: string }>;
    mimeType?: string;
    body?: { data?: string };
    parts?: GmailPayload[];
}

/**
 * Gmail message response structure
 */
interface GmailMessageResponse {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    payload: GmailPayload;
    internalDate: string;
}

/**
 * Check if an error should trigger token refresh
 */
export function isAuthError(statusCode: number): boolean {
    return statusCode === 401;
}

/**
 * Check if an error is retryable (rate limits, etc.)
 */
export function isRetryableError(statusCode: number, errorReason?: string): boolean {
    if (statusCode === 429) return true;
    if (statusCode >= 500 && statusCode < 600) return true;
    if (errorReason && GMAIL_RETRYABLE_ERRORS.includes(errorReason as typeof GMAIL_RETRYABLE_ERRORS[number])) {
        return true;
    }
    return false;
}

/**
 * Fetch new messages from Gmail since a given timestamp
 * Uses Gmail's after: query operator for efficient filtering
 */
export async function fetchNewMessages(
    accessToken: string,
    afterTimestamp: Date,
    maxResults = 100
): Promise<GmailMessage[]> {
    const epochSeconds = Math.floor(afterTimestamp.getTime() / 1000);
    const query = `in:inbox after:${epochSeconds}`;

    const messages: GmailMessage[] = [];
    let nextPageToken: string | undefined;

    do {
        const url = new URL(`${GMAIL_API_BASE}/messages`);
        url.searchParams.set('q', query);
        url.searchParams.set('maxResults', String(Math.min(maxResults, 100)));
        if (nextPageToken) {
            url.searchParams.set('pageToken', nextPageToken);
        }

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const statusCode = response.status;
            const errorText = await response.text();

            if (isAuthError(statusCode)) {
                throw new GmailSendError('Gmail OAuth token expired', 'AUTH_ERROR', statusCode, false);
            }

            throw new GmailSendError(
                `Failed to fetch messages: ${errorText}`,
                'FETCH_ERROR',
                statusCode,
                isRetryableError(statusCode)
            );
        }

        const data: GmailListResponse = await response.json();

        if (data.messages) {
            messages.push(...data.messages.map(m => ({ id: m.id, threadId: m.threadId })));
        }

        nextPageToken = data.nextPageToken;

        // Stop if we've reached our limit
        if (messages.length >= maxResults) {
            break;
        }
    } while (nextPageToken);

    return messages.slice(0, maxResults);
}

/**
 * Fetch full details of a Gmail message
 */
export async function fetchMessageDetails(
    accessToken: string,
    messageId: string
): Promise<GmailMessageDetails> {
    const url = `${GMAIL_API_BASE}/messages/${messageId}?format=full`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const statusCode = response.status;
        const errorText = await response.text();

        if (isAuthError(statusCode)) {
            throw new GmailSendError('Gmail OAuth token expired', 'AUTH_ERROR', statusCode, false);
        }

        throw new GmailSendError(
            `Failed to fetch message details: ${errorText}`,
            'FETCH_ERROR',
            statusCode,
            isRetryableError(statusCode)
        );
    }

    const data: GmailMessageResponse = await response.json();

    // Extract headers
    const getHeader = (name: string): string => {
        const header = data.payload.headers.find(
            h => h.name.toLowerCase() === name.toLowerCase()
        );
        return header?.value ?? '';
    };

    // Extract body
    const bodyResult = extractBodyFromMimePart(data.payload) ?? {
        raw: data.snippet || '',
        cleaned: data.snippet || '',
    };

    return {
        id: data.id,
        threadId: data.threadId,
        labelIds: data.labelIds,
        snippet: data.snippet,
        headers: {
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            messageId: getHeader('Message-ID'),
            inReplyTo: getHeader('In-Reply-To') || undefined,
            references: getHeader('References') || undefined,
        },
        body: bodyResult,
        internalDate: data.internalDate,
    };
}

/**
 * Batch fetch multiple message details with rate limiting
 * @param accessToken Gmail OAuth token
 * @param messageIds Array of message IDs to fetch
 * @param delayMs Delay between requests (default 100ms)
 */
export async function batchFetchMessageDetails(
    accessToken: string,
    messageIds: string[],
    delayMs = 100
): Promise<Map<string, GmailMessageDetails | Error>> {
    const results = new Map<string, GmailMessageDetails | Error>();

    for (const id of messageIds) {
        try {
            const details = await fetchMessageDetails(accessToken, id);
            results.set(id, details);
        } catch (error) {
            results.set(id, error instanceof Error ? error : new Error(String(error)));
        }

        // Add delay between requests to respect rate limits
        if (delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}

/**
 * Determine if a message is an inbound reply (not sent by us)
 */
export function isInboundMessage(
    messageDetails: GmailMessageDetails,
    ourEmail: string
): boolean {
    const fromEmail = extractEmailAddress(messageDetails.headers.from);
    return fromEmail.toLowerCase() !== ourEmail.toLowerCase();
}
