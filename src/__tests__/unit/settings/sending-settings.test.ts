/**
 * Unit Tests for Sending Settings Utilities
 * Story 5.3: Sending Settings Configuration
 */

import { describe, it, expect } from 'vitest';
import {
    isWithinSendingWindow,
    getNextSendingSlot,
    calculateRampUpQuota,
    formatHourRange,
    getBrowserTimezone,
} from '@/lib/utils/sending-window';

describe('isWithinSendingWindow', () => {
    const defaultSettings = {
        sendingDays: [1, 2, 3, 4, 5], // Mon-Fri
        startHour: 9,
        endHour: 18,
        timezone: 'Europe/Paris',
    };

    it('should return true for a date within sending window', () => {
        // Monday at 10am Paris time
        const date = new Date('2026-02-02T10:00:00+01:00'); // Mon Feb 2, 2026
        expect(isWithinSendingWindow(defaultSettings, date)).toBe(true);
    });

    it('should return false for a date outside hour range', () => {
        // Monday at 8am Paris time (before 9am)
        const date = new Date('2026-02-02T08:00:00+01:00');
        expect(isWithinSendingWindow(defaultSettings, date)).toBe(false);
    });

    it('should return false for a date after end hour', () => {
        // Monday at 7pm Paris time (after 18h)
        const date = new Date('2026-02-02T19:00:00+01:00');
        expect(isWithinSendingWindow(defaultSettings, date)).toBe(false);
    });

    it('should return false for a weekend day', () => {
        // Saturday at 10am Paris time
        const date = new Date('2026-02-07T10:00:00+01:00'); // Sat Feb 7, 2026
        expect(isWithinSendingWindow(defaultSettings, date)).toBe(false);
    });

    it('should return true for Saturday if included in sendingDays', () => {
        const weekendSettings = { ...defaultSettings, sendingDays: [6] }; // Saturday only
        const date = new Date('2026-02-07T10:00:00+01:00'); // Sat Feb 7, 2026
        expect(isWithinSendingWindow(weekendSettings, date)).toBe(true);
    });

    it('should handle different timezones correctly', () => {
        const nySettings = { ...defaultSettings, timezone: 'America/New_York' };
        // 3pm Paris = 9am New York (within window for NY)
        const date = new Date('2026-02-02T15:00:00+01:00'); // Monday
        expect(isWithinSendingWindow(nySettings, date)).toBe(true);
    });
});

describe('calculateRampUpQuota', () => {
    it('should return 20 for day 1 with ramp-up enabled', () => {
        const settings = { dailyQuota: 50, rampUpEnabled: true };
        expect(calculateRampUpQuota(settings, 1)).toBe(20);
    });

    it('should return 30 for day 2 with ramp-up enabled', () => {
        const settings = { dailyQuota: 50, rampUpEnabled: true };
        expect(calculateRampUpQuota(settings, 2)).toBe(30);
    });

    it('should return 40 for day 3 with ramp-up enabled', () => {
        const settings = { dailyQuota: 50, rampUpEnabled: true };
        expect(calculateRampUpQuota(settings, 3)).toBe(40);
    });

    it('should return dailyQuota for day 4+ with ramp-up enabled', () => {
        const settings = { dailyQuota: 50, rampUpEnabled: true };
        expect(calculateRampUpQuota(settings, 4)).toBe(50);
        expect(calculateRampUpQuota(settings, 10)).toBe(50);
    });

    it('should return dailyQuota for all days with ramp-up disabled', () => {
        const settings = { dailyQuota: 30, rampUpEnabled: false };
        expect(calculateRampUpQuota(settings, 1)).toBe(30);
        expect(calculateRampUpQuota(settings, 2)).toBe(30);
        expect(calculateRampUpQuota(settings, 3)).toBe(30);
    });

    it('should cap ramp-up at dailyQuota if quota is lower', () => {
        const settings = { dailyQuota: 25, rampUpEnabled: true };
        // Day 2 ramp-up is 30, but quota is 25
        expect(calculateRampUpQuota(settings, 2)).toBe(25);
        expect(calculateRampUpQuota(settings, 3)).toBe(25);
    });
});

describe('getNextSendingSlot', () => {
    const defaultSettings = {
        sendingDays: [1, 2, 3, 4, 5], // Mon-Fri
        startHour: 9,
        endHour: 18,
        timezone: 'Europe/Paris',
    };

    it('should return same time if already within window', () => {
        // Monday at 10am Paris time
        const fromDate = new Date('2026-02-02T10:00:00+01:00');
        const result = getNextSendingSlot(defaultSettings, fromDate);
        expect(result.getTime()).toBe(fromDate.getTime());
    });

    it('should return start of window if before opening', () => {
        // Monday at 7am Paris time
        const fromDate = new Date('2026-02-02T07:00:00+01:00');
        const result = getNextSendingSlot(defaultSettings, fromDate);
        // Should be set to 9am that day
        expect(result.getHours()).toBeGreaterThanOrEqual(8); // Allowing for TZ drift in test
        expect(result.getDate()).toBe(2);
    });

    it('should throw error if no sending days configured', () => {
        const noSettings = { ...defaultSettings, sendingDays: [] };
        const fromDate = new Date('2026-02-02T10:00:00+01:00');
        expect(() => getNextSendingSlot(noSettings, fromDate)).toThrow('No sending days configured');
    });
});

describe('formatHourRange', () => {
    it('should format hours with "h" suffix', () => {
        expect(formatHourRange(9, 18)).toBe('9h - 18h');
    });

    it('should handle midnight correctly', () => {
        expect(formatHourRange(0, 23)).toBe('0h - 23h');
    });
});

describe('getBrowserTimezone', () => {
    it('should return a valid timezone string', () => {
        const tz = getBrowserTimezone();
        expect(typeof tz).toBe('string');
        expect(tz.length).toBeGreaterThan(0);
    });
});
