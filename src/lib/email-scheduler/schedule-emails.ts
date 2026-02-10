/**
 * Email Scheduling Service
 * Story 5.4: Email Scheduling Queue (DB Pillar with Idempotency)
 * 
 * Main service for scheduling emails for campaign prospects
 */

import { prisma } from '@/lib/prisma/client';
import { Prisma, EnrollmentStatus, CampaignStatus, ScheduledEmailStatus } from '@prisma/client';
import { generateIdempotencyKey } from '@/lib/utils/idempotency';
import { getNextSendingSlot, calculateRampUpQuota } from '@/lib/utils/sending-window';
import { getDailySentCount, getNextAvailableSlot } from '@/lib/guardrails/quota';
import type { SchedulingResult, CreateScheduledEmailInput } from '@/types/scheduled-email';
import { RANDOM_DELAY_RANGE } from '@/types/scheduled-email';

const BATCH_SIZE = 100; // Process 100 prospects at a time

/**
 * Check if a Prisma error is a unique constraint violation
 */
function isPrismaUniqueConstraintError(error: unknown): boolean {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
    );
}

/**
 * Add random delay to a date (30-90 seconds for human-like pattern)
 */
function addRandomDelay(date: Date): Date {
    const { min, max } = RANDOM_DELAY_RANGE;
    const randomSeconds = min + Math.random() * (max - min);
    return new Date(date.getTime() + randomSeconds * 1000);
}

/**
 * Calculate the scheduled time for a step
 */
function calculateStepScheduleTime(
    baseTime: Date,
    stepDelayDays: number,
    settings: {
        sendingDays: number[];
        startHour: number;
        endHour: number;
        timezone: string;
    }
): Date {
    // Add step delay days
    const targetDate = new Date(baseTime);
    targetDate.setDate(targetDate.getDate() + stepDelayDays);

    // Find the next valid sending slot
    return getNextSendingSlot(settings, targetDate);
}

/**
 * Schedule all emails for a campaign
 * Optimized with batching and bulk inserts
 */
export async function scheduleEmailsForCampaign(
    campaignId: string
): Promise<SchedulingResult> {
    const result: SchedulingResult = {
        scheduled: 0,
        skipped: 0,
        errors: [],
    };

    // 1. Validations and Setup
    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
            sequence: {
                include: {
                    steps: {
                        orderBy: { order: 'asc' },
                    },
                },
            },
        },
    });

    if (!campaign || campaign.status !== CampaignStatus.RUNNING) {
        result.errors.push(`Invalid campaign or status: ${campaignId}`);
        return result;
    }

    if (!campaign.sequence?.steps.length) {
        result.errors.push('Campaign has no sequence or steps');
        return result;
    }

    const settings = await prisma.sendingSettings.findUnique({
        where: { workspaceId: campaign.workspaceId },
    });

    if (!settings || (settings.sendingDays as number[]).length === 0) {
        result.errors.push('Invalid sending settings');
        return result;
    }

    const sendingDays = settings.sendingDays as number[];
    const commonSettings = {
        sendingDays,
        startHour: settings.startHour,
        endHour: settings.endHour,
        timezone: settings.timezone,
        dailyQuota: settings.dailyQuota,
        rampUpEnabled: settings.rampUpEnabled,
    };

    // 2. Initialize State
    let dayNumber = 1;
    let currentSlot = await getNextAvailableSlot(
        campaign.workspaceId,
        new Date(),
        commonSettings,
        dayNumber
    );

    let currentDay = new Date(currentSlot);
    currentDay.setUTCHours(0, 0, 0, 0);
    let dailyCount = await getDailySentCount(campaign.workspaceId, currentSlot);
    let dailyQuota = calculateRampUpQuota(settings, dayNumber);

    // 3. Process Prospects in Batches
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
        const prospects = await prisma.campaignProspect.findMany({
            where: {
                campaignId,
                enrollmentStatus: EnrollmentStatus.ENROLLED,
            },
            take: BATCH_SIZE,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { campaignId_prospectId: { campaignId, prospectId: cursor } } : undefined,
            orderBy: { prospectId: 'asc' }, // Stable sort
            include: { prospect: true },
        });

        if (prospects.length === 0) {
            hasMore = false;
            break;
        }

        const toInsert: CreateScheduledEmailInput[] = [];

        for (const enrollment of prospects) {
            let prospectBaseTime = currentSlot;

            for (const step of campaign.sequence.steps) {
                const idempotencyKey = generateIdempotencyKey(
                    enrollment.prospectId,
                    campaign.sequence.id,
                    step.order
                );

                const stepDelayDays = step.order > 1 ? step.delayDays : 0;
                let scheduledFor = calculateStepScheduleTime(
                    prospectBaseTime,
                    stepDelayDays,
                    {
                        sendingDays,
                        startHour: settings.startHour,
                        endHour: settings.endHour,
                        timezone: settings.timezone,
                    }
                );

                // Quota Check
                const scheduledDay = new Date(scheduledFor);
                scheduledDay.setUTCHours(0, 0, 0, 0);

                if (scheduledDay.getTime() !== currentDay.getTime()) {
                    currentDay = scheduledDay;
                    dayNumber++;
                    dailyCount = await getDailySentCount(campaign.workspaceId, scheduledFor); // Re-check DB for the new day
                    dailyQuota = calculateRampUpQuota(settings, dayNumber);
                }

                if (dailyCount >= dailyQuota) {
                    // Move to next day
                    const nextDay = new Date(scheduledFor);
                    nextDay.setDate(nextDay.getDate() + 1);
                    nextDay.setHours(0, 0, 0, 0);

                    scheduledFor = await getNextAvailableSlot(
                        campaign.workspaceId,
                        nextDay,
                        commonSettings,
                        dayNumber + 1
                    );

                    currentDay = new Date(scheduledFor);
                    currentDay.setUTCHours(0, 0, 0, 0);
                    dayNumber++; // Rough increment
                    dailyCount = 0;
                    dailyQuota = calculateRampUpQuota(settings, dayNumber);
                }

                scheduledFor = addRandomDelay(scheduledFor);

                toInsert.push({
                    workspaceId: campaign.workspaceId,
                    campaignId: campaign.id,
                    campaignProspectId: enrollment.id,
                    prospectId: enrollment.prospectId,
                    sequenceId: campaign.sequence.id,
                    stepNumber: step.order,
                    idempotencyKey,
                    scheduledFor,
                });

                dailyCount++;
                prospectBaseTime = scheduledFor;
            }

            // Track the first email time for this prospect to advance slot correctly
            const firstEmailTime = toInsert.length > 0 ? toInsert[toInsert.length - campaign.sequence.steps.length]?.scheduledFor : currentSlot;

            // Advance slot for next prospect with small delay AFTER FIRST EMAIL only
            // This ensures all prospects start their sequences on the same day (in parallel)
            currentSlot = addRandomDelay(new Date(firstEmailTime || currentSlot));
        }

        // Bulk Insert
        if (toInsert.length > 0) {
            try {
                const { count } = await prisma.scheduledEmail.createMany({
                    data: toInsert,
                    skipDuplicates: true,
                });
                result.scheduled += count;
                result.skipped += (toInsert.length - count);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                result.errors.push(`Batch insert failed: ${errorMessage}`);
                console.error('[EmailScheduler] Batch insert error:', error);
            }
        }

        cursor = prospects[prospects.length - 1].prospectId; // Use prospectId as cursor (part of compound key)
        if (prospects.length < BATCH_SIZE) {
            hasMore = false;
        }
    }

    console.log(
        `[EmailScheduler] Campaign ${campaignId}: scheduled=${result.scheduled}, skipped=${result.skipped}, errors=${result.errors.length}`
    );

    return result;
}

/**
 * Get pending scheduled emails ready to be sent
 * 
 * @param workspaceId - Optional workspace filter
 * @param limit - Maximum number of emails to fetch
 * @returns Array of scheduled emails ready to send
 */
export async function getPendingEmails(
    workspaceId?: string,
    limit: number = 10
) {
    const now = new Date();

    return prisma.scheduledEmail.findMany({
        where: {
            ...(workspaceId && { workspaceId }),
            status: {
                in: [ScheduledEmailStatus.SCHEDULED, ScheduledEmailStatus.RETRY_SCHEDULED],
            },
            OR: [
                {
                    status: ScheduledEmailStatus.SCHEDULED,
                    scheduledFor: { lte: now },
                },
                {
                    status: ScheduledEmailStatus.RETRY_SCHEDULED,
                    nextRetryAt: { lte: now },
                },
            ],
        },
        orderBy: [
            { scheduledFor: 'asc' },
        ],
        take: limit,
        include: {
            campaign: true,
            campaignProspect: true,
            prospect: true,
            sequence: {
                include: {
                    steps: {
                        orderBy: { order: 'asc' },
                    },
                },
            },
        },
    });
}

/**
 * Get scheduled email statistics for a campaign
 * 
 * @param campaignId - The campaign ID
 * @returns Statistics object with counts by status
 */
export async function getCampaignEmailStats(campaignId: string) {
    const stats = await prisma.scheduledEmail.groupBy({
        by: ['status'],
        where: { campaignId },
        _count: { id: true },
    });

    const result: Record<ScheduledEmailStatus, number> = {
        SCHEDULED: 0,
        SENDING: 0,
        SENT: 0,
        FAILED: 0,
        RETRY_SCHEDULED: 0,
        PERMANENTLY_FAILED: 0,
        CANCELLED: 0,
    };

    for (const stat of stats) {
        result[stat.status] = stat._count.id;
    }

    return result;
}
