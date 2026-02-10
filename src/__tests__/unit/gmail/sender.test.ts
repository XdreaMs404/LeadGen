/**
 * Unit Tests: Gmail Sender
 * Story 5.5: Gmail API Email Sending with Threading
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    sendEmail,
    base64urlEncode,
    GmailSendError,
    GMAIL_RETRYABLE_ERRORS,
    GMAIL_NON_RETRYABLE_ERRORS,
} from '@/lib/gmail/sender';

describe('base64urlEncode', () => {
    it('encodes string to base64url format', () => {
        const input = 'Hello World';
        const result = base64urlEncode(input);

        // Base64url should not contain + / or =
        expect(result).not.toContain('+');
        expect(result).not.toContain('/');
        expect(result).not.toContain('=');

        // Should be decodable back
        const decoded = Buffer.from(result.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
        expect(decoded).toBe(input);
    });

    it('handles special characters', () => {
        const input = 'Test with special chars: é à ü';
        const result = base64urlEncode(input);

        expect(result).not.toContain('+');
        expect(result).not.toContain('/');
    });

    it('handles empty string', () => {
        const result = base64urlEncode('');
        expect(result).toBe('');
    });
});

describe('GmailSendError', () => {
    it('creates error with all properties', () => {
        const error = new GmailSendError(
            'Rate limit exceeded',
            'rateLimitExceeded',
            429,
            true
        );

        expect(error.message).toBe('Rate limit exceeded');
        expect(error.code).toBe('rateLimitExceeded');
        expect(error.statusCode).toBe(429);
        expect(error.isRetryable).toBe(true);
        expect(error.name).toBe('GmailSendError');
    });

    it('works with non-retryable errors', () => {
        const error = new GmailSendError(
            'Invalid grant',
            'invalidGrant',
            401,
            false
        );

        expect(error.isRetryable).toBe(false);
    });
});

describe('sendEmail', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('fetch', mockFetch);
        mockFetch.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('sends email successfully and returns result', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 'msg-123',
                threadId: 'thread-456',
                labelIds: ['SENT'],
            }),
        });

        const result = await sendEmail('access-token', {
            raw: base64urlEncode('From: test@example.com\r\n\r\nBody'),
        });

        expect(result.messageId).toBe('msg-123');
        expect(result.threadId).toBe('thread-456');
        expect(result.labelIds).toContain('SENT');

        expect(mockFetch).toHaveBeenCalledWith(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer access-token',
                    'Content-Type': 'application/json',
                },
            })
        );
    });

    it('includes threadId in request body when provided', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 'msg-123',
                threadId: 'thread-456',
                labelIds: [],
            }),
        });

        await sendEmail('token', {
            raw: 'raw-email',
            threadId: 'thread-existing',
        });

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);

        expect(body.threadId).toBe('thread-existing');
        expect(body.raw).toBe('raw-email');
    });

    it('throws retryable error for rate limit (429)', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 429,
            text: async () => JSON.stringify({
                error: {
                    code: 429,
                    message: 'Rate limit exceeded',
                    errors: [{ reason: 'rateLimitExceeded' }],
                },
            }),
        });

        try {
            await sendEmail('token', { raw: 'email' });
            expect.fail('Should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(GmailSendError);
            if (error instanceof GmailSendError) {
                expect(error.isRetryable).toBe(true);
                expect(error.statusCode).toBe(429);
            }
        }
    });

    it('throws non-retryable error for invalid grant (401)', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 401,
            text: async () => JSON.stringify({
                error: {
                    code: 401,
                    message: 'Invalid credentials',
                    errors: [{ reason: 'authError' }],
                },
            }),
        });

        try {
            await sendEmail('token', { raw: 'email' });
            expect.fail('Should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(GmailSendError);
            if (error instanceof GmailSendError) {
                expect(error.isRetryable).toBe(false);
                expect(error.statusCode).toBe(401);
            }
        }
    });

    it('treats 5xx errors as retryable', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => JSON.stringify({
                error: {
                    code: 500,
                    message: 'Internal server error',
                },
            }),
        });

        try {
            await sendEmail('token', { raw: 'email' });
        } catch (error) {
            if (error instanceof GmailSendError) {
                expect(error.isRetryable).toBe(true);
            }
        }
    });

    it('handles network errors as retryable', async () => {
        mockFetch.mockRejectedValueOnce(new Error('ECONNRESET'));

        try {
            await sendEmail('token', { raw: 'email' });
        } catch (error) {
            if (error instanceof GmailSendError) {
                expect(error.isRetryable).toBe(true);
                expect(error.code).toBe('NETWORK_ERROR');
            }
        }
    });
});

describe('Error code constants', () => {
    it('includes expected retryable error codes', () => {
        expect(GMAIL_RETRYABLE_ERRORS).toContain('rateLimitExceeded');
        expect(GMAIL_RETRYABLE_ERRORS).toContain('quotaExceeded');
        expect(GMAIL_RETRYABLE_ERRORS).toContain('backendError');
    });

    it('includes expected non-retryable error codes', () => {
        expect(GMAIL_NON_RETRYABLE_ERRORS).toContain('invalidGrant');
        expect(GMAIL_NON_RETRYABLE_ERRORS).toContain('authError');
        expect(GMAIL_NON_RETRYABLE_ERRORS).toContain('invalidArgument');
    });
});
