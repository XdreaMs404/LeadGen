/**
 * Anomaly Detection Service
 * Story 5.8: Anomaly Detection & Auto-Pause (Deliverability)
 * 
 * Implements detection of high bounce/unsubscribe rates with volume-based thresholds.
 */

import { prisma } from '@/lib/prisma/client';
import { CampaignStatus, ScheduledEmailStatus, AutoPauseReason } from '@prisma/client';
import {
    AnomalyMetrics,
    AnomalyResult,
    BOUNCE_THRESHOLDS,
    UNSUBSCRIBE_THRESHOLDS,
    ROLLING_WINDOW_HOURS,
    VolumeTier,
    ThresholdConfig,
} from '@/types/anomaly-detection';

/**
 * Keywords indicating a bounce-related error
 */
const BOUNCE_KEYWORDS = ['bounce', 'invalid', 'not found', 'rejected', 'does not exist', 'unknown user'];

/**
 * Determine the volume tier based on email count
 */
export function getVolumeTier(emailCount: number): VolumeTier | null {
    if (emailCount >= 500) return 'HIGH';
    if (emailCount >= 100) return 'MEDIUM';
    if (emailCount >= 20) return 'LOW_MEDIUM';
    if (emailCount >= 5) return 'VERY_LOW';
    return null; // Not enough volume for detection
}

/**
 * Calculate bounce rate for a campaign in the rolling window
 * Returns rate as percentage (0-100) and counts
 */
export async function calculateBounceRate(
    campaignId: string
): Promise<{ rate: number; count: number; total: number }> {
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - ROLLING_WINDOW_HOURS);

    // Get all sent/failed emails in the rolling window
    const emails = await prisma.scheduledEmail.findMany({
        where: {
            campaignId,
            status: { in: [ScheduledEmailStatus.SENT, ScheduledEmailStatus.PERMANENTLY_FAILED] },
            updatedAt: { gte: windowStart },
        },
        select: { status: true, lastError: true },
    });

    const total = emails.length;
    if (total === 0) return { rate: 0, count: 0, total: 0 };

    // Count bounces (PERMANENTLY_FAILED with bounce-related errors)
    const bounceCount = emails.filter(e =>
        e.status === ScheduledEmailStatus.PERMANENTLY_FAILED &&
        BOUNCE_KEYWORDS.some(kw => e.lastError?.toLowerCase().includes(kw))
    ).length;

    return {
        rate: (bounceCount / total) * 100,
        count: bounceCount,
        total
    };
}

/**
 * Calculate unsubscribe rate for a campaign in the rolling window
 * Returns rate as percentage (0-100) and counts
 */
export async function calculateUnsubscribeRate(
    campaignId: string
): Promise<{ rate: number; count: number; total: number }> {
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - ROLLING_WINDOW_HOURS);

    // Get total sent emails in window
    const totalSent = await prisma.scheduledEmail.count({
        where: {
            campaignId,
            status: ScheduledEmailStatus.SENT,
            sentAt: { gte: windowStart },
        },
    });

    if (totalSent === 0) return { rate: 0, count: 0, total: 0 };

    // Count unsubscribed prospects for this campaign
    const unsubscribeCount = await prisma.campaignProspect.count({
        where: {
            campaignId,
            prospect: { status: 'UNSUBSCRIBED' },
        },
    });

    return {
        rate: (unsubscribeCount / totalSent) * 100,
        count: unsubscribeCount,
        total: totalSent,
    };
}

/**
 * Check if thresholds are exceeded for warning
 */
function checkWarningThreshold(
    rate: number,
    count: number,
    threshold: ThresholdConfig
): boolean {
    // For VERY_LOW tier, warning is count-based only
    if (threshold.warningRatePercent === 0) {
        return count >= threshold.warningMinCount;
    }
    return rate >= threshold.warningRatePercent && count >= threshold.warningMinCount;
}

/**
 * Check if thresholds are exceeded for auto-pause
 */
function checkPauseThreshold(
    rate: number,
    count: number,
    threshold: ThresholdConfig
): boolean {
    return rate >= threshold.pauseRatePercent && count >= threshold.pauseMinCount;
}

/**
 * Detect anomalies for a single campaign
 * Returns analysis with recommendation (warn, pause, or none)
 */
export async function detectAnomalies(campaignId: string): Promise<AnomalyResult | null> {
    // Get campaign details
    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { id: true, name: true, status: true, workspaceId: true },
    });

    if (!campaign || campaign.status !== CampaignStatus.RUNNING) {
        return null; // Only analyze running campaigns
    }

    // Calculate metrics
    const bounce = await calculateBounceRate(campaignId);
    const unsubscribe = await calculateUnsubscribeRate(campaignId);

    // Determine volume tier from bounce total (primary metric)
    const totalSent = Math.max(bounce.total, unsubscribe.total);
    const volumeTier = getVolumeTier(totalSent);

    // Not enough volume for detection
    if (!volumeTier) {
        return null;
    }

    const metrics: AnomalyMetrics = {
        campaignId,
        campaignName: campaign.name,
        totalSent,
        volumeTier,
        bounceCount: bounce.count,
        bounceRate: bounce.rate,
        unsubscribeCount: unsubscribe.count,
        unsubscribeRate: unsubscribe.rate,
        windowHours: ROLLING_WINDOW_HOURS,
    };

    const bounceThreshold = BOUNCE_THRESHOLDS[volumeTier];
    const unsubscribeThreshold = UNSUBSCRIBE_THRESHOLDS[volumeTier];

    // Check for auto-pause conditions (highest priority)
    if (checkPauseThreshold(bounce.rate, bounce.count, bounceThreshold)) {
        return {
            campaignId,
            workspaceId: campaign.workspaceId,
            campaignName: campaign.name,
            metrics,
            shouldPause: true,
            shouldWarn: false,
            reason: AutoPauseReason.HIGH_BOUNCE_RATE,
            severity: 'ERROR',
            message: `Taux de bounce élevé: ${bounce.rate.toFixed(1)}%`,
        };
    }

    if (checkPauseThreshold(unsubscribe.rate, unsubscribe.count, unsubscribeThreshold)) {
        return {
            campaignId,
            workspaceId: campaign.workspaceId,
            campaignName: campaign.name,
            metrics,
            shouldPause: true,
            shouldWarn: false,
            reason: AutoPauseReason.HIGH_UNSUBSCRIBE_RATE,
            severity: 'ERROR',
            message: `Taux de désabonnement élevé: ${unsubscribe.rate.toFixed(1)}%`,
        };
    }

    // Check for warning conditions
    if (checkWarningThreshold(bounce.rate, bounce.count, bounceThreshold)) {
        return {
            campaignId,
            workspaceId: campaign.workspaceId,
            campaignName: campaign.name,
            metrics,
            shouldPause: false,
            shouldWarn: true,
            reason: AutoPauseReason.HIGH_BOUNCE_RATE,
            severity: 'WARNING',
            message: `Attention: Taux de bounce à surveiller (${bounce.rate.toFixed(1)}%)`,
        };
    }

    if (checkWarningThreshold(unsubscribe.rate, unsubscribe.count, unsubscribeThreshold)) {
        return {
            campaignId,
            workspaceId: campaign.workspaceId,
            campaignName: campaign.name,
            metrics,
            shouldPause: false,
            shouldWarn: true,
            reason: AutoPauseReason.HIGH_UNSUBSCRIBE_RATE,
            severity: 'WARNING',
            message: `Attention: Taux de désabonnement à surveiller (${unsubscribe.rate.toFixed(1)}%)`,
        };
    }

    // No anomalies detected
    return {
        campaignId,
        workspaceId: campaign.workspaceId,
        campaignName: campaign.name,
        metrics,
        shouldPause: false,
        shouldWarn: false,
        reason: null,
        severity: null,
        message: null,
    };
}

/**
 * Run anomaly detection for all RUNNING campaigns in a workspace
 * Returns list of campaigns that were auto-paused
 */
export async function runAnomalyDetectionForWorkspace(
    workspaceId: string
): Promise<AnomalyResult[]> {
    // Get all running campaigns for the workspace
    const campaigns = await prisma.campaign.findMany({
        where: {
            workspaceId,
            status: CampaignStatus.RUNNING,
        },
        select: { id: true },
    });

    const results: AnomalyResult[] = [];

    for (const campaign of campaigns) {
        const result = await detectAnomalies(campaign.id);
        if (result && (result.shouldPause || result.shouldWarn)) {
            results.push(result);
        }
    }

    // Log detection summary
    console.log(`[Anomaly] Scanned ${campaigns.length} campaigns, found ${results.length} with anomalies`);

    return results;
}
