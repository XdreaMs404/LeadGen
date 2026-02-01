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
 * 
 * @param baseTime - The base time to calculate from
 * @param stepDelayDays - The delay in days for this step
 * @param settings - The sending settings
 * @returns The scheduled date/time
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
 * 
 * @param campaignId - The campaign ID to schedule emails for
 * @returns SchedulingResult with counts and any errors
 */
export async function scheduleEmailsForCampaign(
    campaignId: string
): Promise<SchedulingResult> {
    const result: SchedulingResult = {
        scheduled: 0,
        skipped: 0,
        errors: [],
    };

    // Load campaign with all necessary relations
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
            prospects: {
                where: {
                    enrollmentStatus: EnrollmentStatus.ENROLLED,
                },
                include: {
                    prospect: true,
                },
            },
        },
    });

    if (!campaign) {
        result.errors.push(`Campaign not found: ${campaignId}`);
        return result;
    }

    if (campaign.status !== CampaignStatus.RUNNING) {
        result.errors.push(`Campaign is not in RUNNING status: ${campaign.status}`);
        return result;
    }

    if (!campaign.sequence) {
        result.errors.push('Campaign has no sequence attached');
        return result;
    }

    if (campaign.sequence.steps.length === 0) {
        result.errors.push('Sequence has no steps');
        return result;
    }

    if (campaign.prospects.length === 0) {
        result.errors.push('No enrolled prospects in campaign');
        return result;
    }

    // Load sending settings
    const settings = await prisma.sendingSettings.findUnique({
        where: { workspaceId: campaign.workspaceId },
    });

    if (!settings) {
        result.errors.push('No sending settings configured for workspace');
        return result;
    }

    // Parse sending days
    const sendingDays = settings.sendingDays as number[];
    if (sendingDays.length === 0) {
        result.errors.push('No sending days configured');
        return result;
    }

    // Calculate starting point
    let dayNumber = 1; // For ramp-up calculation
    let currentSlot = await getNextAvailableSlot(
        campaign.workspaceId,
        new Date(),
        {
            sendingDays,
            startHour: settings.startHour,
            endHour: settings.endHour,
            timezone: settings.timezone,
            dailyQuota: settings.dailyQuota,
            rampUpEnabled: settings.rampUpEnabled,
        },
        dayNumber
    );

    // Track daily counts for quota enforcement
    let currentDay = new Date(currentSlot);
    currentDay.setUTCHours(0, 0, 0, 0);
    let dailyCount = await getDailySentCount(campaign.workspaceId, currentSlot);
    let dailyQuota = calculateRampUpQuota(settings, dayNumber);

    // Process each enrolled prospect
    for (const enrollment of campaign.prospects) {
        // Skip if prospect enrollment was paused/stopped
        if (enrollment.enrollmentStatus !== EnrollmentStatus.ENROLLED) {
            continue;
        }

        // Calculate base time for this prospect's sequence
        let prospectBaseTime = currentSlot;

        // Schedule each step in the sequence
        for (const step of campaign.sequence.steps) {
            // Generate idempotency key
            const idempotencyKey = generateIdempotencyKey(
                enrollment.prospectId,
                campaign.sequence.id,
                step.order
            );

            // Calculate step delay (step 1 has 0 delay, others have delayDays)
            const stepDelayDays = step.order > 1 ? step.delayDays : 0;

            // Calculate scheduled time
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

            // Check if we need to move to next day (quota exceeded)
            const scheduledDay = new Date(scheduledFor);
            scheduledDay.setUTCHours(0, 0, 0, 0);

            if (scheduledDay.getTime() !== currentDay.getTime()) {
                // New day - reset counts
                currentDay = scheduledDay;
                dayNumber++;
                dailyCount = await getDailySentCount(campaign.workspaceId, scheduledFor);
                dailyQuota = calculateRampUpQuota(settings, dayNumber);
            }

            // Enforce quota
            if (dailyCount >= dailyQuota) {
                // Move to next available day
                const nextDay = new Date(scheduledFor);
                nextDay.setDate(nextDay.getDate() + 1);
                nextDay.setHours(0, 0, 0, 0);

                scheduledFor = await getNextAvailableSlot(
                    campaign.workspaceId,
                    nextDay,
                    {
                        sendingDays,
                        startHour: settings.startHour,
                        endHour: settings.endHour,
                        timezone: settings.timezone,
                        dailyQuota: settings.dailyQuota,
                        rampUpEnabled: settings.rampUpEnabled,
                    },
                    dayNumber + 1
                );

                // Update tracking
                currentDay = new Date(scheduledFor);
                currentDay.setUTCHours(0, 0, 0, 0);
                dayNumber++;
                dailyCount = 0;
                dailyQuota = calculateRampUpQuota(settings, dayNumber);
            }

            // Add random delay for human-like pattern
            scheduledFor = addRandomDelay(scheduledFor);

            // Create the scheduled email record
            const createInput: CreateScheduledEmailInput = {
                workspaceId: campaign.workspaceId,
                campaignId: campaign.id,
                campaignProspectId: enrollment.id,
                prospectId: enrollment.prospectId,
                sequenceId: campaign.sequence.id,
                stepNumber: step.order,
                idempotencyKey,
                scheduledFor,
            };

            try {
                await prisma.scheduledEmail.create({
                    data: createInput,
                });

                result.scheduled++;
                dailyCount++;

                // Update base time for next step
                prospectBaseTime = scheduledFor;
            } catch (error) {
                if (isPrismaUniqueConstraintError(error)) {
                    // Duplicate - skip gracefully
                    result.skipped++;
                    console.log(`[EmailScheduler] Skipped duplicate: ${idempotencyKey}`);
                } else {
                    // Other error - log and continue
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    result.errors.push(`Error scheduling ${idempotencyKey}: ${errorMessage}`);
                    console.error(`[EmailScheduler] Error scheduling ${idempotencyKey}:`, error);
                }
            }
        }

        // Move slot forward for next prospect
        currentSlot = addRandomDelay(prospectBaseTime);
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
