/**
 * Unit Tests for Quota Service
 * Story 5.4: Email Scheduling Queue (DB Pillar with Idempotency)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEffectiveDailyQuota } from '@/lib/guardrails/quota';
import { calculateRampUpQuota } from '@/lib/utils/sending-window';
import { RAMP_UP_SCHEDULE } from '@/types/sending-settings';

describe('getEffectiveDailyQuota', () => {
    describe('with ramp-up disabled', () => {
        const settings = {
            dailyQuota: 50,
            rampUpEnabled: false,
        };

        it('should return full quota on day 1', () => {
            expect(getEffectiveDailyQuota(settings, 1)).toBe(50);
        });

        it('should return full quota on any day', () => {
            expect(getEffectiveDailyQuota(settings, 3)).toBe(50);
            expect(getEffectiveDailyQuota(settings, 10)).toBe(50);
        });
    });

    describe('with ramp-up enabled', () => {
        const settings = {
            dailyQuota: 50,
            rampUpEnabled: true,
        };

        it('should apply ramp-up schedule on day 1', () => {
            const expected = Math.min(RAMP_UP_SCHEDULE[0], 50);
            expect(getEffectiveDailyQuota(settings, 1)).toBe(expected);
        });

        it('should apply ramp-up schedule on day 2', () => {
            const expected = Math.min(RAMP_UP_SCHEDULE[1], 50);
            expect(getEffectiveDailyQuota(settings, 2)).toBe(expected);
        });

        it('should apply ramp-up schedule on day 3', () => {
            const expected = Math.min(RAMP_UP_SCHEDULE[2], 50);
            expect(getEffectiveDailyQuota(settings, 3)).toBe(expected);
        });

        it('should return full quota after ramp-up period', () => {
            expect(getEffectiveDailyQuota(settings, 4)).toBe(50);
            expect(getEffectiveDailyQuota(settings, 7)).toBe(50);
        });

        it('should cap ramp-up at dailyQuota if lower', () => {
            const lowQuota = {
                dailyQuota: 15, // Lower than RAMP_UP_SCHEDULE values
                rampUpEnabled: true,
            };

            // Should never exceed dailyQuota
            expect(getEffectiveDailyQuota(lowQuota, 1)).toBeLessThanOrEqual(15);
            expect(getEffectiveDailyQuota(lowQuota, 2)).toBeLessThanOrEqual(15);
            expect(getEffectiveDailyQuota(lowQuota, 3)).toBeLessThanOrEqual(15);
        });
    });
});

describe('calculateRampUpQuota', () => {
    describe('behavior', () => {
        it('should return dailyQuota when rampUpEnabled is false', () => {
            const settings = { dailyQuota: 40, rampUpEnabled: false };
            expect(calculateRampUpQuota(settings, 1)).toBe(40);
            expect(calculateRampUpQuota(settings, 2)).toBe(40);
            expect(calculateRampUpQuota(settings, 10)).toBe(40);
        });

        it('should follow RAMP_UP_SCHEDULE when enabled', () => {
            const settings = { dailyQuota: 100, rampUpEnabled: true };

            expect(calculateRampUpQuota(settings, 1)).toBe(RAMP_UP_SCHEDULE[0]);
            expect(calculateRampUpQuota(settings, 2)).toBe(RAMP_UP_SCHEDULE[1]);
            expect(calculateRampUpQuota(settings, 3)).toBe(RAMP_UP_SCHEDULE[2]);
            // After ramp-up period
            expect(calculateRampUpQuota(settings, 4)).toBe(100);
        });

        it('should not exceed dailyQuota even during ramp-up', () => {
            const settings = { dailyQuota: 10, rampUpEnabled: true };

            // RAMP_UP_SCHEDULE is [20, 30, 40], but dailyQuota is 10
            expect(calculateRampUpQuota(settings, 1)).toBe(10);
            expect(calculateRampUpQuota(settings, 2)).toBe(10);
            expect(calculateRampUpQuota(settings, 3)).toBe(10);
        });
    });
});
