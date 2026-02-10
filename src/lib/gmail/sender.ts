/**
 * Gmail Email Sending Client
 * Story 5.5: Gmail API Email Sending with Threading
 * 
 * Sends emails via Gmail API with proper error handling and retry logic
 */

/**
 * Parameters for sending an email
 */
export interface SendEmailParams {
    /** RFC 2822 formatted email, base64url encoded */
    raw: string;
    /** Gmail thread ID for threading (optional, for follow-ups) */
    threadId?: string;
}

/**
 * Result from Gmail API send operation
 */
export interface SendEmailResult {
    /** Gmail message ID */
    messageId: string;
    /** Gmail thread ID */
    threadId: string;
    /** Gmail labels (usually ['SENT']) */
    labelIds: string[];
}

/**
 * Gmail API error response structure
 */
interface GmailApiError {
    error: {
        code: number;
        message: string;
        status?: string;
        errors?: Array<{
            message: string;
            domain: string;
            reason: string;
        }>;
    };
}

/**
 * Gmail-specific retryable error codes
 */
export const GMAIL_RETRYABLE_ERRORS = [
    'rateLimitExceeded',
    'userRateLimitExceeded',
    'quotaExceeded',
    'backendError',
    'internalError',
    'ECONNRESET',
    'ETIMEDOUT',
] as const;

/**
 * Gmail-specific non-retryable error codes
 */
export const GMAIL_NON_RETRYABLE_ERRORS = [
    'invalidGrant',
    'authError',
    'invalid',
    'notFound',
    'failedPrecondition',
    'invalidArgument',
] as const;

/**
 * Custom error class for Gmail API errors
 */
export class GmailSendError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number,
        public readonly isRetryable: boolean
    ) {
        super(message);
        this.name = 'GmailSendError';
    }
}

/**
 * Determine if a Gmail API error is retryable
 */
function isGmailErrorRetryable(errorData: GmailApiError): boolean {
    const reason = errorData.error.errors?.[0]?.reason;
    const statusCode = errorData.error.code;

    // Check known retryable reasons
    if (reason && GMAIL_RETRYABLE_ERRORS.includes(reason as any)) {
        return true;
    }

    // Check status codes (5xx are usually retryable)
    if (statusCode >= 500 && statusCode < 600) {
        return true;
    }

    // 429 (rate limit) is retryable
    if (statusCode === 429) {
        return true;
    }

    // Check non-retryable reasons
    if (reason && GMAIL_NON_RETRYABLE_ERRORS.includes(reason as any)) {
        return false;
    }

    // 400-level errors (except 429) are usually not retryable
    if (statusCode >= 400 && statusCode < 500) {
        return false;
    }

    // Default: not retryable
    return false;
}

/**
 * Extract error code from Gmail API error
 */
function extractErrorCode(errorData: GmailApiError): string {
    return (
        errorData.error.errors?.[0]?.reason ||
        errorData.error.status ||
        `HTTP_${errorData.error.code}`
    );
}

/**
 * Base64url encode a string (RFC 4648 §5)
 * Required format for Gmail API
 */
export function base64urlEncode(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Send an email via Gmail API
 * 
 * @param accessToken - Gmail OAuth access token
 * @param params - Email parameters including raw message and optional threadId
 * @returns SendEmailResult with messageId and threadId
 * @throws GmailSendError if sending fails
 */
export async function sendEmail(
    accessToken: string,
    params: SendEmailParams
): Promise<SendEmailResult> {
    const url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

    // Build request body
    const body: { raw: string; threadId?: string } = {
        raw: params.raw,
    };

    // Include threadId for threading (follow-up emails)
    if (params.threadId) {
        body.threadId = params.threadId;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData: GmailApiError;

            try {
                errorData = JSON.parse(errorText);
            } catch {
                // If response isn't valid JSON, create a structured error
                errorData = {
                    error: {
                        code: response.status,
                        message: errorText || response.statusText,
                    },
                };
            }

            const errorCode = extractErrorCode(errorData);
            const isRetryable = isGmailErrorRetryable(errorData);

            console.error('Gmail API send error:', {
                statusCode: response.status,
                errorCode,
                message: errorData.error.message,
                isRetryable,
            });

            throw new GmailSendError(
                errorData.error.message,
                errorCode,
                response.status,
                isRetryable
            );
        }

        const data = await response.json();

        return {
            messageId: data.id,
            threadId: data.threadId,
            labelIds: data.labelIds || [],
        };
    } catch (error) {
        // Re-throw GmailSendError as-is
        if (error instanceof GmailSendError) {
            throw error;
        }

        // Handle network errors
        const message = error instanceof Error ? error.message : String(error);
        const isNetworkError =
            message.includes('ECONNRESET') ||
            message.includes('ETIMEDOUT') ||
            message.includes('ENOTFOUND') ||
            message.includes('fetch failed');

        throw new GmailSendError(
            `Gmail API request failed: ${message}`,
            isNetworkError ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
            0,
            isNetworkError // Network errors are retryable
        );
    }
}
