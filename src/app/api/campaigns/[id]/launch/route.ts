import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { checkPreLaunchRequirements } from '@/lib/guardrails/pre-launch-check';
import { mapCampaign } from '@/lib/prisma/mappers';
import { z } from 'zod';
import { CampaignStatus } from '@prisma/client';

// Validation schema for launch request
const LaunchCampaignSchema = z.object({
    prospectIds: z.array(z.string().min(1)).min(1, 'Sélectionnez au moins un prospect'),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/campaigns/[id]/launch - Launch a campaign
 * Story 5.2: Campaign Launch Wizard with Pre-Launch Gating - AC5
 * 
 * Steps:
 * 1. Validate request (prospectIds array required)
 * 2. Run pre-launch checks (onboarding, gmail, sequence, prospects)
 * 3. If issues: return LAUNCH_BLOCKED with issue details
 * 4. Update campaign: DRAFT → RUNNING, set startedAt
 * 5. Create CampaignProspect records for selected prospects
 * 6. Return updated campaign with enrollment count
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
        const body = await req.json();
        const parsed = LaunchCampaignSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        const { prospectIds } = parsed.data;

        // Check campaign exists and belongs to workspace
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, workspaceId },
            include: { sequence: { select: { id: true } } },
        });

        if (!campaign) {
            return NextResponse.json(
                error('NOT_FOUND', 'Campagne non trouvée'),
                { status: 404 }
            );
        }

        // Only DRAFT campaigns can be launched
        if (campaign.status !== CampaignStatus.DRAFT) {
            return NextResponse.json(
                error('INVALID_STATUS', `La campagne est déjà en statut "${campaign.status}"`),
                { status: 400 }
            );
        }

        // Run pre-launch checks
        const preLaunchResult = await checkPreLaunchRequirements(
            workspaceId,
            campaign.sequenceId,
            prospectIds
        );

        if (!preLaunchResult.canLaunch) {
            return NextResponse.json(
                error('LAUNCH_BLOCKED', 'Les conditions de lancement ne sont pas remplies', preLaunchResult.issues),
                { status: 400 }
            );
        }

        // Launch the campaign in a transaction
        const updatedCampaign = await prisma.$transaction(async (tx) => {
            // Update campaign status
            const updated = await tx.campaign.update({
                where: { id: campaignId },
                data: {
                    status: CampaignStatus.RUNNING,
                    startedAt: new Date(),
                },
                include: {
                    sequence: { select: { id: true, name: true } },
                },
            });

            // Create CampaignProspect records for each selected prospect
            await tx.campaignProspect.createMany({
                data: prospectIds.map((prospectId) => ({
                    campaignId: campaignId,
                    prospectId: prospectId,
                    enrollmentStatus: 'ENROLLED' as const,
                    currentStep: 1,
                })),
                skipDuplicates: true, // Prevent errors if prospect already enrolled
            });

            return updated;
        });

        // Fetch campaign with enrollment counts for response
        const campaignWithEnrollments = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                sequence: { select: { id: true, name: true } },
                prospects: { select: { enrollmentStatus: true } },
            },
        });

        return NextResponse.json(
            success(mapCampaign(campaignWithEnrollments!)),
            { status: 200 }
        );
    } catch (e) {
        console.error('POST /api/campaigns/[id]/launch error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
