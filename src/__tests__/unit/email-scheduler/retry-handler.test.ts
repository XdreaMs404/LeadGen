/**
 * Unit Tests for Retry Handler
 * Story 5.4: Email Scheduling Queue (DB Pillar with Idempotency)
 */

import { describe, it, expect } from 'vitest';
import {
    isRetryableError,
    calculateBackoffMinutes,
    calculateNextRetryAt
} from '@/lib/email-scheduler/retry-handler';
import { RETRY_BACKOFF_MINUTES } from '@/types/scheduled-email';

describe('isRetryableError', () => {
    describe('should identify retryable errors', () => {
        it('network errors', () => {
            expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
            expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
            expect(isRetryableError(new Error('ENOTFOUND'))).toBe(true);
            expect(isRetryableError('CONNECTION_ERROR: Socket hang up')).toBe(true);
            expect(isRetryableError('NETWORK_ERROR: Unable to connect')).toBe(true);
        });

        it('rate limit errors', () => {
            expect(isRetryableError(new Error('RATE_LIMIT_EXCEEDED'))).toBe(true);
            expect(isRetryableError('Rate limit exceeded, try again later')).toBe(true);
            expect(isRetryableError('Too many requests')).toBe(true);
        });

        it('temporary failures', () => {
            expect(isRetryableError(new Error('TEMPORARY_FAILURE'))).toBe(true);
            expect(isRetryableError(new Error('SERVICE_UNAVAILABLE'))).toBe(true);
            expect(isRetryableError('Temporarily unavailable')).toBe(true);
        });

        it('5xx status codes', () => {
            expect(isRetryableError('Error 500: Internal Server Error')).toBe(true);
            expect(isRetryableError('HTTP 503 Service Unavailable')).toBe(true);
            expect(isRetryableError('Status: 502 Bad Gateway')).toBe(true);
        });

        it('timeout errors', () => {
            expect(isRetryableError('Connection timeout')).toBe(true);
            expect(isRetryableError('Request timed out')).toBe(true);
        });
    });

    describe('should identify non-retryable errors', () => {
        it('invalid recipient', () => {
            expect(isRetryableError(new Error('INVALID_RECIPIENT'))).toBe(false);
            expect(isRetryableError('INVALID_EMAIL: Bad address')).toBe(false);
            expect(isRetryableError('RECIPIENT_NOT_FOUND')).toBe(false);
        });

        it('auth errors', () => {
            expect(isRetryableError(new Error('AUTH_REVOKED'))).toBe(false);
            expect(isRetryableError(new Error('TOKEN_EXPIRED'))).toBe(false);
            expect(isRetryableError('PERMISSION_DENIED: Access denied')).toBe(false);
        });

        it('hard bounces', () => {
            expect(isRetryableError(new Error('MAIL_HARD_BOUNCE'))).toBe(false);
        });
    });

    describe('handles edge cases', () => {
        it('should handle string errors', () => {
            expect(isRetryableError('ECONNRESET')).toBe(true);
            expect(isRetryableError('INVALID_RECIPIENT')).toBe(false);
        });

        it('should handle Error objects', () => {
            expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
            expect(isRetryableError(new Error('INVALID_RECIPIENT'))).toBe(false);
        });
    });
});

describe('calculateBackoffMinutes', () => {
    it('should return correct backoff values', () => {
        expect(calculateBackoffMinutes(0)).toBe(RETRY_BACKOFF_MINUTES[0]); // 1 min
        expect(calculateBackoffMinutes(1)).toBe(RETRY_BACKOFF_MINUTES[1]); // 5 min
        expect(calculateBackoffMinutes(2)).toBe(RETRY_BACKOFF_MINUTES[2]); // 15 min
    });

    it('should handle out of range attempts', () => {
        // Negative attempts should return first backoff
        expect(calculateBackoffMinutes(-1)).toBe(RETRY_BACKOFF_MINUTES[0]);

        // Beyond max attempts should return last backoff
        expect(calculateBackoffMinutes(5)).toBe(RETRY_BACKOFF_MINUTES[2]);
        expect(calculateBackoffMinutes(100)).toBe(RETRY_BACKOFF_MINUTES[2]);
    });

    it('should use exponential backoff pattern', () => {
        const first = calculateBackoffMinutes(0);
        const second = calculateBackoffMinutes(1);
        const third = calculateBackoffMinutes(2);

        // Verify increasing delays
        expect(second).toBeGreaterThan(first);
        expect(third).toBeGreaterThan(second);
    });
});

describe('calculateNextRetryAt', () => {
    it('should calculate future date', () => {
        const now = new Date();
        const nextRetry = calculateNextRetryAt(0);

        expect(nextRetry.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should add correct minutes based on attempt', () => {
        const before = new Date();
        const nextRetry = calculateNextRetryAt(0);
        const after = new Date();

        // Should be at least 1 minute (RETRY_BACKOFF_MINUTES[0]) in the future
        const minExpected = before.getTime() + RETRY_BACKOFF_MINUTES[0] * 60 * 1000;
        const maxExpected = after.getTime() + RETRY_BACKOFF_MINUTES[0] * 60 * 1000;

        expect(nextRetry.getTime()).toBeGreaterThanOrEqual(minExpected - 1000); // Allow 1s tolerance
        expect(nextRetry.getTime()).toBeLessThanOrEqual(maxExpected + 1000);
    });

    it('should increase delay with more attempts', () => {
        const retry1 = calculateNextRetryAt(0);
        const retry2 = calculateNextRetryAt(1);
        const retry3 = calculateNextRetryAt(2);

        // Each retry should be further in the future
        expect(retry2.getTime()).toBeGreaterThan(retry1.getTime());
        expect(retry3.getTime()).toBeGreaterThan(retry2.getTime());
    });
});
