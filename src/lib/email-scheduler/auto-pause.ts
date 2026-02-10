/**
 * Auto-Pause Service
 * Story 5.8: Anomaly Detection & Auto-Pause (Deliverability)
 * 
 * Implements auto-pausing of campaigns with anomaly detection.
 */

import { prisma } from '@/lib/prisma/client';
import { CampaignStatus, AutoPauseReason } from '@prisma/client';
import { mapCampaign } from '@/lib/prisma/mappers';
import { CampaignResponse } from '@/types/campaign';
import { AnomalyResult, AutoPausedCampaign, AnomalyMetrics } from '@/types/anomaly-detection';
import { runAnomalyDetectionForWorkspace } from './anomaly-detection';
import { createAnomalyNotification } from '@/lib/notifications/anomaly-notification';

/**
 * Auto-pause a campaign due to anomaly detection
 * Sets status to PAUSED and records the reason
 */
export async function autoPauseCampaign(
    campaignId: string,
    reason: AutoPauseReason,
    metrics: AnomalyMetrics
): Promise<CampaignResponse> {
    // Use transaction for atomicity
    const updated = await prisma.$transaction(async (tx) => {
        // Verify campaign is still RUNNING (race condition protection)
        const campaign = await tx.campaign.findUnique({
            where: { id: campaignId },
            select: { id: true, status: true, workspaceId: true, autoPausedReason: true },
        });

        if (!campaign) {
            throw new Error('Campagne non trouvée');
        }

        // Don't auto-pause if already paused, stopped, or completed
        if (campaign.status !== CampaignStatus.RUNNING) {
            console.log(`[Auto-Pause] Skipping ${campaignId}: status is ${campaign.status}`);
            throw new Error('La campagne n\'est plus en cours d\'exécution');
        }

        // Update campaign with auto-pause
        const updatedCampaign = await tx.campaign.update({
            where: { id: campaignId },
            data: {
                status: CampaignStatus.PAUSED,
                pausedAt: new Date(),
                autoPausedReason: reason,
            },
            include: {
                sequence: { select: { id: true, name: true } },
                prospects: { select: { enrollmentStatus: true } },
            },
        });

        // Create audit log
        await tx.auditLog.create({
            data: {
                workspaceId: campaign.workspaceId,
                userId: 'SYSTEM',
                action: 'CAMPAIGN_AUTO_PAUSED',
                entityType: 'CAMPAIGN',
                entityId: campaignId,
                metadata: {
                    reason,
                    metrics: {
                        bounceRate: metrics.bounceRate,
                        bounceCount: metrics.bounceCount,
                        unsubscribeRate: metrics.unsubscribeRate,
                        unsubscribeCount: metrics.unsubscribeCount,
                        totalSent: metrics.totalSent,
                        volumeTier: metrics.volumeTier,
                    } as any,
                },
            },
        });

        return updatedCampaign;
    });

    console.log(`[Auto-Pause] Campaign ${campaignId} paused for ${reason}`);

    return mapCampaign(updated);
}

/**
 * Process anomaly detection results and auto-pause campaigns as needed
 */
export async function processAnomalyResults(
    results: AnomalyResult[]
): Promise<AutoPausedCampaign[]> {
    const pausedCampaigns: AutoPausedCampaign[] = [];

    for (const result of results) {
        // 1. Handle Auto-Pause if needed
        if (result.shouldPause && result.reason) {
            try {
                await autoPauseCampaign(result.campaignId, result.reason, result.metrics);
                pausedCampaigns.push({
                    campaignId: result.campaignId,
                    campaignName: result.campaignName,
                    reason: result.reason,
                    metrics: result.metrics,
                    pausedAt: new Date(),
                });
                console.log(`[Auto-Pause] ⚠️ Paused campaign "${result.campaignName}" - ${result.message}`);
            } catch (error) {
                console.error(`[Auto-Pause] Failed to pause campaign ${result.campaignId}:`, error);
            }
        }

        // 2. Create Notifications (for both Pauses AND Warnings)
        if (result.shouldPause || result.shouldWarn) {
            try {
                await createAnomalyNotification(result, result.workspaceId);
            } catch (error) {
                console.error('[Auto-Pause] Failed to create notification:', error);
            }
        }
    }

    return pausedCampaigns;
}

/**
 * Run full anomaly detection and auto-pause flow for a workspace
 * This is the main entry point called from the email sender
 */
export async function runAnomalyDetectionAndPause(
    workspaceId: string
): Promise<AutoPausedCampaign[]> {
    const results = await runAnomalyDetectionForWorkspace(workspaceId);
    return processAnomalyResults(results);
}

/**
 * Resume a campaign that was auto-paused, with risk acknowledgment
 * Clears the autoPausedReason on resume
 */
export async function resumeAutoPausedCampaign(
    campaignId: string,
    workspaceId: string,
    acknowledgeRisk: boolean
): Promise<CampaignResponse> {
    const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, workspaceId },
        select: {
            id: true,
            status: true,
            autoPausedReason: true,
            pausedAt: true,
        },
    });

    if (!campaign) {
        throw new Error('Campagne non trouvée');
    }

    if (campaign.status !== CampaignStatus.PAUSED) {
        throw new Error('La campagne n\'est pas en pause');
    }

    // If auto-paused, require acknowledgment
    if (campaign.autoPausedReason && !acknowledgeRisk) {
        throw new Error('Vous devez accepter le risque pour reprendre cette campagne');
    }

    // Calculate pause duration for shifting scheduled dates
    const pauseDurationMs = campaign.pausedAt
        ? Date.now() - campaign.pausedAt.getTime()
        : 0;

    // Use transaction for atomicity
    const updated = await prisma.$transaction(async (tx) => {
        // Shift scheduled email dates by pause duration
        const pendingEmails = await tx.scheduledEmail.findMany({
            where: {
                campaignId,
                status: { in: ['SCHEDULED', 'RETRY_SCHEDULED'] },
            },
            select: { id: true, scheduledFor: true },
        });

        for (const email of pendingEmails) {
            const newScheduledFor = new Date(email.scheduledFor.getTime() + pauseDurationMs);
            await tx.scheduledEmail.update({
                where: { id: email.id },
                data: { scheduledFor: newScheduledFor },
            });
        }

        // Update campaign status and clear autoPausedReason
        const updatedCampaign = await tx.campaign.update({
            where: { id: campaignId },
            data: {
                status: CampaignStatus.RUNNING,
                pausedAt: null,
                autoPausedReason: null, // Clear the auto-pause reason
            },
            include: {
                sequence: { select: { id: true, name: true } },
                prospects: { select: { enrollmentStatus: true } },
            },
        });

        // Create audit log
        await tx.auditLog.create({
            data: {
                workspaceId,
                userId: 'SYSTEM', // Will be updated when we have user context
                action: 'CAMPAIGN_RESUMED_AFTER_AUTO_PAUSE',
                entityType: 'CAMPAIGN',
                entityId: campaignId,
                metadata: {
                    previousReason: campaign.autoPausedReason,
                    acknowledgedRisk: acknowledgeRisk,
                    pauseDurationMs,
                },
            },
        });

        return updatedCampaign;
    });

    console.log(`[Auto-Pause] Campaign ${campaignId} resumed (risk acknowledged: ${acknowledgeRisk})`);

    return mapCampaign(updated);
}
