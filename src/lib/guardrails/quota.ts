/**
 * Quota Service
 * Story 5.4: Email Scheduling Queue (DB Pillar with Idempotency)
 * 
 * Manages daily email quotas with ramp-up support
 */

import { prisma } from '@/lib/prisma/client';
import { calculateRampUpQuota, getNextSendingSlot } from '@/lib/utils/sending-window';
import type { SendingSettings } from '@/types/sending-settings';

/**
 * Get the count of emails sent or scheduled for a specific day
 * 
 * @param workspaceId - The workspace ID
 * @param date - The date to check
 * @returns The count of emails already scheduled/sent for that day
 */
export async function getDailySentCount(
    workspaceId: string,
    date: Date
): Promise<number> {
    // Get start and end of day in UTC
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Count scheduled emails for this day that aren't cancelled or permanently failed
    const count = await prisma.scheduledEmail.count({
        where: {
            workspaceId,
            scheduledFor: {
                gte: startOfDay,
                lte: endOfDay,
            },
            status: {
                notIn: ['CANCELLED', 'PERMANENTLY_FAILED'],
            },
        },
    });

    return count;
}

/**
 * Get the remaining quota for a specific day
 * 
 * @param workspaceId - The workspace ID
 * @param date - The date to check
 * @param settings - The sending settings (optional, will be fetched if not provided)
 * @param dayNumber - The campaign day number for ramp-up calculation (default: 1)
 * @returns The remaining quota for the day
 */
export async function getRemainingQuota(
    workspaceId: string,
    date: Date,
    settings?: Pick<SendingSettings, 'dailyQuota' | 'rampUpEnabled'>,
    dayNumber: number = 1
): Promise<number> {
    // Fetch settings if not provided
    let sendingSettings = settings;
    if (!sendingSettings) {
        const dbSettings = await prisma.sendingSettings.findUnique({
            where: { workspaceId },
        });
        if (!dbSettings) {
            // Default quota if no settings exist
            return 30;
        }
        sendingSettings = {
            dailyQuota: dbSettings.dailyQuota,
            rampUpEnabled: dbSettings.rampUpEnabled,
        };
    }

    const dailyQuota = calculateRampUpQuota(sendingSettings, dayNumber);
    const sentCount = await getDailySentCount(workspaceId, date);

    return Math.max(0, dailyQuota - sentCount);
}

/**
 * Get the next available slot considering quota limits
 * 
 * @param workspaceId - The workspace ID
 * @param afterDate - Start searching from this date
 * @param settings - The sending settings
 * @param dayNumber - The campaign day number for ramp-up calculation
 * @returns The next available date/time for scheduling
 */
export async function getNextAvailableSlot(
    workspaceId: string,
    afterDate: Date,
    settings: Pick<SendingSettings, 'sendingDays' | 'startHour' | 'endHour' | 'timezone' | 'dailyQuota' | 'rampUpEnabled'>,
    dayNumber: number = 1
): Promise<Date> {
    let currentDate = afterDate;
    let attempts = 0;
    const maxAttempts = 30; // Max 30 days to search

    while (attempts < maxAttempts) {
        // Get the next valid sending slot
        const nextSlot = getNextSendingSlot(settings, currentDate);

        // Check if there's quota remaining for that day
        const remaining = await getRemainingQuota(
            workspaceId,
            nextSlot,
            settings,
            dayNumber
        );

        if (remaining > 0) {
            return nextSlot;
        }

        // Move to the next day
        currentDate = new Date(nextSlot);
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
        attempts++;
        dayNumber++; // Increment day for ramp-up calculation
    }

    // Fallback: return the slot even if quota is exceeded (shouldn't happen in practice)
    console.warn(`Could not find available slot within ${maxAttempts} days for workspace ${workspaceId}`);
    return getNextSendingSlot(settings, currentDate);
}

/**
 * Calculate the effective daily quota for a given day number
 * 
 * @param settings - The sending settings
 * @param dayNumber - The campaign day number (1-indexed)
 * @returns The maximum emails allowed for that day
 */
export function getEffectiveDailyQuota(
    settings: Pick<SendingSettings, 'dailyQuota' | 'rampUpEnabled'>,
    dayNumber: number
): number {
    return calculateRampUpQuota(settings, dayNumber);
}

/**
 * Check if quota is available for scheduling
 * 
 * @param workspaceId - The workspace ID
 * @param date - The date to check
 * @param settings - The sending settings
 * @param dayNumber - The campaign day number
 * @returns true if at least 1 email can be scheduled
 */
export async function hasQuotaAvailable(
    workspaceId: string,
    date: Date,
    settings: Pick<SendingSettings, 'dailyQuota' | 'rampUpEnabled'>,
    dayNumber: number = 1
): Promise<boolean> {
    const remaining = await getRemainingQuota(workspaceId, date, settings, dayNumber);
    return remaining > 0;
}
