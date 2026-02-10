/**
 * Prospect Control Service
 * Story 5.7: Individual Lead Control within Campaign
 * 
 * Implements pause, resume, and stop operations for individual prospects.
 * Unlike campaign-level control, prospect resume does NOT shift email dates.
 */

import { prisma } from '@/lib/prisma/client';
import { EnrollmentStatus, ScheduledEmailStatus } from '@prisma/client';
import { mapCampaignProspect } from '@/lib/prisma/mappers';
import { CampaignProspectResponse } from '@/types/campaign';
import {
    ProspectAction,
    isValidProspectTransition,
    getProspectTransitionError,
    StopProspectResult,
} from '@/types/prospect-control';

/**
 * Pause an enrolled prospect.
 * Sets enrollmentStatus to PAUSED and records pausedAt timestamp.
 * Scheduled emails remain unchanged (will be skipped by worker until resumed).
 */
export async function pauseProspect(
    campaignId: string,
    prospectId: string,
    workspaceId: string
): Promise<CampaignProspectResponse> {
    // Validate campaign ownership
    const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, workspaceId },
    });
    if (!campaign) {
        throw new Error('Campagne non trouvée');
    }

    // Find the enrollment
    const enrollment = await prisma.campaignProspect.findUnique({
        where: {
            campaignId_prospectId: { campaignId, prospectId },
        },
    });
    if (!enrollment) {
        throw new Error('Prospect non inscrit à cette campagne');
    }

    // Validate transition
    if (!isValidProspectTransition(enrollment.enrollmentStatus, 'pause')) {
        throw new Error(getProspectTransitionError(enrollment.enrollmentStatus, 'pause'));
    }

    const updated = await prisma.campaignProspect.update({
        where: { id: enrollment.id },
        data: {
            enrollmentStatus: EnrollmentStatus.PAUSED,
            pausedAt: new Date(),
        },
        include: {
            prospect: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    company: true,
                },
            },
        },
    });

    return mapCampaignProspect(updated);
}

/**
 * Resume a paused prospect.
 * Sets enrollmentStatus to ENROLLED and clears pausedAt.
 * Note: Unlike campaign-level resume, scheduled dates are NOT shifted.
 * The prospect picks up from where they left off without date adjustments.
 */
export async function resumeProspect(
    campaignId: string,
    prospectId: string,
    workspaceId: string
): Promise<CampaignProspectResponse> {
    // Validate campaign ownership
    const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, workspaceId },
    });
    if (!campaign) {
        throw new Error('Campagne non trouvée');
    }

    // Find the enrollment
    const enrollment = await prisma.campaignProspect.findUnique({
        where: {
            campaignId_prospectId: { campaignId, prospectId },
        },
    });
    if (!enrollment) {
        throw new Error('Prospect non inscrit à cette campagne');
    }

    // Validate transition
    if (!isValidProspectTransition(enrollment.enrollmentStatus, 'resume')) {
        throw new Error(getProspectTransitionError(enrollment.enrollmentStatus, 'resume'));
    }

    const updated = await prisma.campaignProspect.update({
        where: { id: enrollment.id },
        data: {
            enrollmentStatus: EnrollmentStatus.ENROLLED,
            pausedAt: null,
        },
        include: {
            prospect: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    company: true,
                },
            },
        },
    });

    return mapCampaignProspect(updated);
}

/**
 * Stop a prospect permanently.
 * Sets enrollmentStatus to STOPPED and cancels all pending emails.
 * Uses the same idempotency key modification pattern as campaign-control.ts.
 */
export async function stopProspect(
    campaignId: string,
    prospectId: string,
    workspaceId: string
): Promise<StopProspectResult> {
    // Validate campaign ownership
    const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, workspaceId },
    });
    if (!campaign) {
        throw new Error('Campagne non trouvée');
    }

    // Find the enrollment
    const enrollment = await prisma.campaignProspect.findUnique({
        where: {
            campaignId_prospectId: { campaignId, prospectId },
        },
    });
    if (!enrollment) {
        throw new Error('Prospect non inscrit à cette campagne');
    }

    // Validate transition
    if (!isValidProspectTransition(enrollment.enrollmentStatus, 'stop')) {
        throw new Error(getProspectTransitionError(enrollment.enrollmentStatus, 'stop'));
    }

    return prisma.$transaction(async (tx) => {
        // 1. Update enrollment status
        const updated = await tx.campaignProspect.update({
            where: { id: enrollment.id },
            data: {
                enrollmentStatus: EnrollmentStatus.STOPPED,
                pausedAt: null, // Clear if was paused
            },
            include: {
                prospect: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        company: true,
                    },
                },
            },
        });

        // 2. Cancel all pending emails for this prospect in this campaign
        const pendingEmails = await tx.scheduledEmail.findMany({
            where: {
                campaignProspectId: enrollment.id,
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
        // Format: originalKey::CANCELLED::prospectId (same pattern as campaign-control.ts)
        let emailsCancelled = 0;
        for (const email of pendingEmails) {
            await tx.scheduledEmail.update({
                where: { id: email.id },
                data: {
                    status: ScheduledEmailStatus.CANCELLED,
                    lastError: 'Prospect stopped by user',
                    idempotencyKey: `${email.idempotencyKey}::CANCELLED::${prospectId}`,
                },
            });
            emailsCancelled++;
        }

        return { prospect: mapCampaignProspect(updated), emailsCancelled };
    });
}

/**
 * Update prospect enrollment status based on action.
 * This is the main entry point for status changes.
 */
export async function updateProspectStatus(
    campaignId: string,
    prospectId: string,
    workspaceId: string,
    action: ProspectAction
): Promise<{ prospect: CampaignProspectResponse; emailsCancelled?: number }> {
    switch (action) {
        case 'pause':
            return { prospect: await pauseProspect(campaignId, prospectId, workspaceId) };
        case 'resume':
            return { prospect: await resumeProspect(campaignId, prospectId, workspaceId) };
        case 'stop':
            return stopProspect(campaignId, prospectId, workspaceId);
        default:
            throw new Error(`Action non supportée: ${action}`);
    }
}
