import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { scheduleEmailsForCampaign, getCampaignEmailStats } from '@/lib/email-scheduler/schedule-emails';
import { CampaignStatus } from '@prisma/client';
import type { SchedulingResult } from '@/types/scheduled-email';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/campaigns/[id]/schedule - Schedule emails for a campaign
 * Story 5.4: Email Scheduling Queue (DB Pillar with Idempotency) - AC1, AC6
 * 
 * Steps:
 * 1. Validate campaign exists and is in RUNNING status
 * 2. Call scheduleEmailsForCampaign to create ScheduledEmail records
 * 3. Return scheduling result (scheduled count, skipped, errors)
 */
export async function POST(
    req: NextRequest,
    { params }: RouteParams
) {
    try {
        // Authenticate user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const { id: campaignId } = await params;

        // Check campaign exists and belongs to workspace
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, workspaceId },
        });

        if (!campaign) {
            return NextResponse.json(
                error('NOT_FOUND', 'Campagne non trouvée'),
                { status: 404 }
            );
        }

        // Only RUNNING campaigns can have emails scheduled
        if (campaign.status !== CampaignStatus.RUNNING) {
            return NextResponse.json(
                error('INVALID_STATUS', `La campagne doit être en statut "RUNNING" pour planifier les emails. Statut actuel: "${campaign.status}"`),
                { status: 400 }
            );
        }

        // Schedule emails for the campaign
        const result: SchedulingResult = await scheduleEmailsForCampaign(campaignId);

        // Log any errors (don't fail the request for partial errors)
        if (result.errors.length > 0) {
            console.error(`[ScheduleAPI] Errors scheduling campaign ${campaignId}:`, result.errors);
        }

        return NextResponse.json(
            success({
                scheduled: result.scheduled,
                skipped: result.skipped,
                errors: result.errors,
                message: result.scheduled > 0
                    ? `${result.scheduled} emails planifiés avec succès`
                    : 'Aucun nouvel email à planifier',
            }),
            { status: 200 }
        );
    } catch (e) {
        console.error('POST /api/campaigns/[id]/schedule error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

/**
 * GET /api/campaigns/[id]/schedule - Get scheduled email statistics
 * Story 5.4: Email Scheduling Queue
 * 
 * Returns counts of scheduled emails by status
 */
export async function GET(
    req: NextRequest,
    { params }: RouteParams
) {
    try {
        // Authenticate user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const { id: campaignId } = await params;

        // Check campaign exists and belongs to workspace
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, workspaceId },
        });

        if (!campaign) {
            return NextResponse.json(
                error('NOT_FOUND', 'Campagne non trouvée'),
                { status: 404 }
            );
        }

        // Get email statistics
        const stats = await getCampaignEmailStats(campaignId);

        return NextResponse.json(
            success({
                campaignId,
                stats,
                total: Object.values(stats).reduce((a, b) => a + b, 0),
            }),
            { status: 200 }
        );
    } catch (e) {
        console.error('GET /api/campaigns/[id]/schedule error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
