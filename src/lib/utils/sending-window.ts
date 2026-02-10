/**
 * Sending Window Utility Functions
 * Story 5.3: Sending Settings Configuration
 */

import type { SendingSettings } from '@/types/sending-settings';
import { RAMP_UP_SCHEDULE } from '@/types/sending-settings';

/**
 * Check if a given date/time falls within the sending window
 * 
 * @param settings - The sending settings configuration
 * @param date - The date to check (in any timezone, will be converted)
 * @returns true if the date is within the sending window
 */
export function isWithinSendingWindow(
    settings: Pick<SendingSettings, 'sendingDays' | 'startHour' | 'endHour' | 'timezone'>,
    date: Date
): boolean {
    // Convert date to the workspace timezone
    const options: Intl.DateTimeFormatOptions = {
        timeZone: settings.timezone,
        weekday: 'short',
        hour: 'numeric',
        hour12: false,
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);

    // Extract day of week (0-6, Sunday = 0)
    const weekdayPart = parts.find(p => p.type === 'weekday');
    const dayOfWeek = weekdayToNumber(weekdayPart?.value || '');

    // Extract hour (0-23)
    const hourPart = parts.find(p => p.type === 'hour');
    const hour = parseInt(hourPart?.value || '0', 10);

    // Check if day is in sending days
    if (!settings.sendingDays.includes(dayOfWeek)) {
        return false;
    }

    // Check if hour is within range
    return hour >= settings.startHour && hour < settings.endHour;
}

/**
 * Get the next valid sending slot from a given date
 * 
 * @param settings - The sending settings configuration
 * @param fromDate - The starting date to search from
 * @returns The next valid send date within the sending window
 */
export function getNextSendingSlot(
    settings: Pick<SendingSettings, 'sendingDays' | 'startHour' | 'endHour' | 'timezone'>,
    fromDate: Date
): Date {
    // Sort sending days to ensure we search efficiently
    const sortedDays = [...settings.sendingDays].sort((a, b) => a - b);

    if (sortedDays.length === 0) {
        throw new Error('No sending days configured');
    }

    // Start with the current date
    let candidate = new Date(fromDate);

    // Search for up to 14 days (2 weeks max)
    for (let i = 0; i < 14; i++) {
        // Get current day and hour in workspace timezone
        const { dayOfWeek, hour, minute } = getDatePartsInTimezone(candidate, settings.timezone);

        // Check if today is a valid sending day
        if (sortedDays.includes(dayOfWeek)) {
            // If we're before the sending window, return start of window today
            if (hour < settings.startHour) {
                return setHourInTimezone(candidate, settings.startHour, 0, settings.timezone);
            }

            // If we're within the sending window, return current time
            if (hour >= settings.startHour && hour < settings.endHour) {
                return candidate;
            }
        }

        // Move to start of next day
        candidate = new Date(candidate);
        candidate.setDate(candidate.getDate() + 1);
        candidate.setHours(0, 0, 0, 0);
    }

    // Fallback: return first valid day at start hour
    return setHourInTimezone(candidate, settings.startHour, 0, settings.timezone);
}

/**
 * Calculate the daily quota based on ramp-up schedule
 * 
 * @param settings - The sending settings configuration
 * @param dayNumber - The campaign day number (1-indexed)
 * @returns The maximum number of emails to send on this day
 */
export function calculateRampUpQuota(
    settings: Pick<SendingSettings, 'dailyQuota' | 'rampUpEnabled'>,
    dayNumber: number
): number {
    if (!settings.rampUpEnabled) {
        return settings.dailyQuota;
    }

    // Day 1: 20, Day 2: 30, Day 3: 40, then cap at dailyQuota
    if (dayNumber <= RAMP_UP_SCHEDULE.length) {
        return Math.min(RAMP_UP_SCHEDULE[dayNumber - 1], settings.dailyQuota);
    }

    return settings.dailyQuota;
}

/**
 * Helper: Convert weekday string to number (0-6)
 */
function weekdayToNumber(weekday: string): number {
    const days: Record<string, number> = {
        'Sun': 0,
        'Mon': 1,
        'Tue': 2,
        'Wed': 3,
        'Thu': 4,
        'Fri': 5,
        'Sat': 6,
    };
    return days[weekday] ?? 0;
}

/**
 * Helper: Get date parts in a specific timezone
 */
function getDatePartsInTimezone(date: Date, timezone: string): {
    dayOfWeek: number;
    hour: number;
    minute: number;
} {
    const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);

    const weekdayPart = parts.find(p => p.type === 'weekday');
    const hourPart = parts.find(p => p.type === 'hour');
    const minutePart = parts.find(p => p.type === 'minute');

    return {
        dayOfWeek: weekdayToNumber(weekdayPart?.value || ''),
        hour: parseInt(hourPart?.value || '0', 10),
        minute: parseInt(minutePart?.value || '0', 10),
    };
}

/**
 * Helper: Set hour in a specific timezone
 * Note: This is a simplified implementation for MVP
 */
function setHourInTimezone(date: Date, hour: number, minute: number, timezone: string): Date {
    // Get the current offset between UTC and target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    // Parse the date in the target timezone
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';

    const year = parseInt(getPart('year'), 10);
    const month = parseInt(getPart('month'), 10) - 1; // JS months are 0-indexed
    const day = parseInt(getPart('day'), 10);
    const currentHour = parseInt(getPart('hour'), 10);

    // Create a date string in the target timezone with the desired hour
    // Then parse it back to get the correct UTC time
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

    // Use the difference between current hour in timezone and current UTC hour to calculate offset
    const utcHour = date.getUTCHours();
    const timezoneOffsetHours = currentHour - utcHour;

    // Normalize the offset (handle day boundaries)
    let normalizedOffset = timezoneOffsetHours;
    if (normalizedOffset > 12) normalizedOffset -= 24;
    if (normalizedOffset < -12) normalizedOffset += 24;

    // Create result date in UTC, adjusted for timezone
    const result = new Date(date);
    result.setUTCFullYear(year, month, day);
    result.setUTCHours(hour - normalizedOffset, minute, 0, 0);

    // Verify the result
    const { hour: resultHour } = getDatePartsInTimezone(result, timezone);
    if (resultHour !== hour) {
        // Apply correction for DST edge cases
        const correction = hour - resultHour;
        if (Math.abs(correction) <= 2) {
            result.setUTCHours(result.getUTCHours() + correction);
        }
    }

    return result;
}

/**
 * Format hour range for display (e.g., "9h - 18h")
 */
export function formatHourRange(startHour: number, endHour: number): string {
    return `${startHour}h - ${endHour}h`;
}

/**
 * Get browser timezone
 */
export function getBrowserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return 'Europe/Paris'; // Fallback
    }
}
