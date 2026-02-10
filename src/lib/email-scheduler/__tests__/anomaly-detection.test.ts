/**
 * Anomaly Detection Unit Tests
 * Story 5.8: Anomaly Detection & Auto-Pause (Deliverability)
 */

import { describe, it, expect } from 'vitest';
import { getVolumeTier } from '@/lib/email-scheduler/anomaly-detection';
import {
    BOUNCE_THRESHOLDS,
    UNSUBSCRIBE_THRESHOLDS,
    ROLLING_WINDOW_HOURS,
} from '@/types/anomaly-detection';

describe('Anomaly Detection - Volume Tiers', () => {
    describe('getVolumeTier', () => {
        it('should return null for very low volume (<5)', () => {
            expect(getVolumeTier(0)).toBeNull();
            expect(getVolumeTier(4)).toBeNull();
        });

        it('should return VERY_LOW for 5-19 emails', () => {
            expect(getVolumeTier(5)).toBe('VERY_LOW');
            expect(getVolumeTier(10)).toBe('VERY_LOW');
            expect(getVolumeTier(19)).toBe('VERY_LOW');
        });

        it('should return LOW_MEDIUM for 20-99 emails', () => {
            expect(getVolumeTier(20)).toBe('LOW_MEDIUM');
            expect(getVolumeTier(50)).toBe('LOW_MEDIUM');
            expect(getVolumeTier(99)).toBe('LOW_MEDIUM');
        });

        it('should return MEDIUM for 100-499 emails', () => {
            expect(getVolumeTier(100)).toBe('MEDIUM');
            expect(getVolumeTier(250)).toBe('MEDIUM');
            expect(getVolumeTier(499)).toBe('MEDIUM');
        });

        it('should return HIGH for 500+ emails', () => {
            expect(getVolumeTier(500)).toBe('HIGH');
            expect(getVolumeTier(1000)).toBe('HIGH');
            expect(getVolumeTier(10000)).toBe('HIGH');
        });
    });
});

describe('Anomaly Detection - Thresholds', () => {
    describe('BOUNCE_THRESHOLDS', () => {
        it('should have VERY_LOW tier with 40% pause threshold', () => {
            expect(BOUNCE_THRESHOLDS.VERY_LOW.pauseRatePercent).toBe(40);
            expect(BOUNCE_THRESHOLDS.VERY_LOW.pauseMinCount).toBe(3);
        });

        it('should have LOW_MEDIUM tier with 8% pause threshold', () => {
            expect(BOUNCE_THRESHOLDS.LOW_MEDIUM.pauseRatePercent).toBe(8);
            expect(BOUNCE_THRESHOLDS.LOW_MEDIUM.pauseMinCount).toBe(4);
        });

        it('should have MEDIUM tier with 5% pause threshold', () => {
            expect(BOUNCE_THRESHOLDS.MEDIUM.pauseRatePercent).toBe(5);
            expect(BOUNCE_THRESHOLDS.MEDIUM.pauseMinCount).toBe(10);
        });

        it('should have HIGH tier with 4% pause threshold', () => {
            expect(BOUNCE_THRESHOLDS.HIGH.pauseRatePercent).toBe(4);
            expect(BOUNCE_THRESHOLDS.HIGH.pauseMinCount).toBe(25);
        });
    });

    describe('UNSUBSCRIBE_THRESHOLDS', () => {
        it('should have VERY_LOW tier with 20% pause threshold', () => {
            expect(UNSUBSCRIBE_THRESHOLDS.VERY_LOW.pauseRatePercent).toBe(20);
            expect(UNSUBSCRIBE_THRESHOLDS.VERY_LOW.pauseMinCount).toBe(3);
        });

        it('should have LOW_MEDIUM tier with 2% pause threshold', () => {
            expect(UNSUBSCRIBE_THRESHOLDS.LOW_MEDIUM.pauseRatePercent).toBe(2);
            expect(UNSUBSCRIBE_THRESHOLDS.LOW_MEDIUM.pauseMinCount).toBe(7);
        });

        it('should have MEDIUM tier with 1.5% pause threshold', () => {
            expect(UNSUBSCRIBE_THRESHOLDS.MEDIUM.pauseRatePercent).toBe(1.5);
            expect(UNSUBSCRIBE_THRESHOLDS.MEDIUM.pauseMinCount).toBe(25);
        });

        it('should have HIGH tier with 1.5% pause threshold', () => {
            expect(UNSUBSCRIBE_THRESHOLDS.HIGH.pauseRatePercent).toBe(1.5);
            expect(UNSUBSCRIBE_THRESHOLDS.HIGH.pauseMinCount).toBe(50);
        });
    });

    describe('ROLLING_WINDOW_HOURS', () => {
        it('should be 24 hours', () => {
            expect(ROLLING_WINDOW_HOURS).toBe(24);
        });
    });
});

