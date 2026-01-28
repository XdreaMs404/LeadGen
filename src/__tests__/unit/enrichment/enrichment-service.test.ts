/**
 * Unit Tests: Enrichment Service
 * Story 3.5: Dropcontact Enrichment Integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateNextRetry, RETRY_DELAYS } from '@/lib/enrichment/enrichment-service';

// Mock dependencies
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        enrichmentJob: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn(),
        },
        prospect: {
            update: vi.fn(),
            findFirst: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock('@/lib/dropcontact/client', () => ({
    submitEnrichmentRequest: vi.fn(),
    fetchEnrichmentResult: vi.fn(),
    isEmailVerified: vi.fn(),
    DropcontactApiError: class extends Error {
        constructor(message: string, public code: string) {
            super(message);
            this.name = 'DropcontactApiError';
        }
    },
}));

vi.mock('@/lib/dropcontact/rate-limiter', () => ({
    acquireDropcontactSlot: vi.fn(),
    releaseDropcontactSlot: vi.fn(),
}));

describe('Enrichment Service', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('calculateNextRetry', () => {
        it('should return correct retry time for first attempt', () => {
            const now = Date.now();
            vi.setSystemTime(now);

            const nextRetry = calculateNextRetry(0);

            expect(nextRetry).not.toBeNull();
            expect(nextRetry!.getTime()).toBe(now + RETRY_DELAYS[0] * 1000);
        });

        it('should return correct retry time for second attempt', () => {
            const now = Date.now();
            vi.setSystemTime(now);

            const nextRetry = calculateNextRetry(1);

            expect(nextRetry).not.toBeNull();
            expect(nextRetry!.getTime()).toBe(now + RETRY_DELAYS[1] * 1000);
        });

        it('should return correct retry time for third attempt', () => {
            const now = Date.now();
            vi.setSystemTime(now);

            const nextRetry = calculateNextRetry(2);

            expect(nextRetry).not.toBeNull();
            expect(nextRetry!.getTime()).toBe(now + RETRY_DELAYS[2] * 1000);
        });

        it('should return null when max retries exceeded', () => {
            const nextRetry = calculateNextRetry(3);
            expect(nextRetry).toBeNull();
        });

        it('should return null for higher attempt counts', () => {
            expect(calculateNextRetry(4)).toBeNull();
            expect(calculateNextRetry(10)).toBeNull();
        });
    });

    describe('RETRY_DELAYS', () => {
        it('should have correct delay values', () => {
            expect(RETRY_DELAYS).toEqual([60, 300, 900]); // 1min, 5min, 15min
        });
    });
});
