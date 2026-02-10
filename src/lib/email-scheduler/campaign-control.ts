/**
 * Campaign Control Service
 * Story 5.6: Campaign Control (Pause/Resume/Stop Global)
 * 
 * Implements pause, resume, and stop operations for campaigns with atomic transactions.
 */

import { prisma } from '@/lib/prisma/client';
import { CampaignStatus, ScheduledEmailStatus } from '@prisma/client';
import { mapCampaign } from '@/lib/prisma/mappers';
import { CampaignResponse } from '@/types/campaign';
import {
    CampaignAction,
    isValidTransition,
    getTargetStatus,
    getTransitionError,
    StopResult,
} from '@/types/campaign-control';

/**
 * Pause a running campaign.
 * Sets status to PAUSED and records pausedAt timestamp.
 */
export async function pauseCampaign(
    campaignId: string,
    workspaceId: string
): Promise<CampaignResponse> {
    const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, workspaceId },
    });

    if (!campaign) {
        throw new Error('Campagne non trouvée');
    }

    if (!isValidTransition(campaign.status, 'pause')) {
        throw new Error(getTransitionError(campaign.status, 'pause'));
    }

    const updated = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
            status: CampaignStatus.PAUSED,
            pausedAt: new Date(),
        },
        include: {
            sequence: { select: { id: true, name: true } },
            prospects: { select: { enrollmentStatus: true } },
        },
    });

    return mapCampaign(updated);
}

/**
 * Resume a paused campaign.
 * Sets status to RUNNING, shifts scheduled email dates by pause duration, and clears pausedAt.
 */
export async function resumeCampaign(
    campaignId: string,
    workspaceId: string
): Promise<CampaignResponse> {
    const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, workspaceId },
    });

    if (!campaign) {
        throw new Error('Campagne non trouvée');
    }

    if (!isValidTransition(campaign.status, 'resume')) {
        throw new Error(getTransitionError(campaign.status, 'resume'));
    }

    if (!campaign.pausedAt) {
        throw new Error('La campagne n\'a pas de date de pause enregistrée');
    }

    // Calculate pause duration
    const pauseDurationMs = Date.now() - campaign.pausedAt.getTime();

    // Use transaction to ensure atomicity
    const updated = await prisma.$transaction(async (tx) => {
        // Shift all scheduled email dates by the pause duration
        await shiftScheduledDates(tx, campaignId, pauseDurationMs);

        // Update campaign status
        const updatedCampaign = await tx.campaign.update({
            where: { id: campaignId },
            data: {
                status: CampaignStatus.RUNNING,
                pausedAt: null,
            },
            include: {
                sequence: { select: { id: true, name: true } },
                prospects: { select: { enrollmentStatus: true } },
            },
        });

        return updatedCampaign;
    });

    return mapCampaign(updated);
}

/**
 * Stop a running or paused campaign permanently.
 * Sets status to STOPPED, cancels all pending emails, and records stoppedAt.
 */
export async function stopCampaign(
    campaignId: string,
    workspaceId: string
): Promise<StopResult> {
    const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, workspaceId },
    });

    if (!campaign) {
        throw new Error('Campagne non trouvée');
    }

    if (!isValidTransition(campaign.status, 'stop')) {
        throw new Error(getTransitionError(campaign.status, 'stop'));
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
        // Update campaign status
        const updatedCampaign = await tx.campaign.update({
            where: { id: campaignId },
            data: {
                status: CampaignStatus.STOPPED,
                stoppedAt: new Date(),
                pausedAt: null, // Clear pausedAt if was paused
            },
            include: {
                sequence: { select: { id: true, name: true } },
                prospects: { select: { enrollmentStatus: true } },
            },
        });

        // Find all pending emails
        const pendingEmails = await tx.scheduledEmail.findMany({
            where: {
                campaignId,
                status: {
                    in: [
                        ScheduledEmailStatus.SCHEDULED,
                        ScheduledEmailStatus.RETRY_SCHEDULED,
                    ],
                },
            },
            select: { id: true, idempotencyKey: true },
        });

        // Cancel each email and modify idempotency key to free it up
        // We append ::CANCELLED::{campaignId} to ensure uniqueness while preserving history
        // This allows the original key (prospect:sequence:step) to be reused in new campaigns
        let emailsCancelled = 0;
        for (const email of pendingEmails) {
            await tx.scheduledEmail.update({
                where: { id: email.id },
                data: {
                    status: ScheduledEmailStatus.CANCELLED,
                    lastError: 'Campaign stopped by user',
                    // Modify key to release the lock while keeping the record
                    // Format: originalKey::CANCELLED::campaignId
                    idempotencyKey: `${email.idempotencyKey}::CANCELLED::${campaignId}`,
                },
            });
            emailsCancelled++;
        }

        return {
            campaign: mapCampaign(updatedCampaign),
            emailsCancelled,
        };
    });

    return result;
}

/**
 * Shift all scheduled email dates by the given duration.
 * Used when resuming a paused campaign to preserve sequence intervals.
 */
async function shiftScheduledDates(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    campaignId: string,
    durationMs: number
): Promise<number> {
    // Get all pending scheduled emails for this campaign
    const pendingEmails = await tx.scheduledEmail.findMany({
        where: {
            campaignId,
            status: {
                in: [
                    ScheduledEmailStatus.SCHEDULED,
                    ScheduledEmailStatus.RETRY_SCHEDULED,
                ],
            },
        },
        select: { id: true, scheduledFor: true },
    });

    // Update each email's scheduledFor date
    // Using individual updates because Prisma doesn't support computed field updates in updateMany
    let updatedCount = 0;
    for (const email of pendingEmails) {
        const newScheduledFor = new Date(email.scheduledFor.getTime() + durationMs);
        await tx.scheduledEmail.update({
            where: { id: email.id },
            data: { scheduledFor: newScheduledFor },
        });
        updatedCount++;
    }

    return updatedCount;
}

/**
 * Update campaign status based on action.
 * This is the main entry point for status changes.
 */
export async function updateCampaignStatus(
    campaignId: string,
    workspaceId: string,
    action: CampaignAction
): Promise<{ campaign: CampaignResponse; emailsCancelled?: number }> {
    switch (action) {
        case 'pause':
            return { campaign: await pauseCampaign(campaignId, workspaceId) };
        case 'resume':
            return { campaign: await resumeCampaign(campaignId, workspaceId) };
        case 'stop':
            return stopCampaign(campaignId, workspaceId);
        default:
            throw new Error(`Action non supportée: ${action}`);
    }
}
