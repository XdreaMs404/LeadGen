/**
 * Campaign Duplicate API Route
 * Story 5.6: Campaign Control (Pause/Resume/Stop Global)
 * 
 * POST /api/campaigns/[id]/duplicate - Duplicate a campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { mapCampaign } from '@/lib/prisma/mappers';
import { CampaignStatus } from '@prisma/client';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/campaigns/[id]/duplicate
 * Create a new campaign based on an existing one
 * 
 * Copies:
 * - name (appends " (Copie)")
 * - sequenceId
 * 
 * Does NOT copy:
 * - enrollments
 * - scheduledEmails
 * - stats/timestamps
 * 
 * New campaign starts in DRAFT status
 */
export async function POST(
    _req: NextRequest,
    { params }: RouteParams
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                error('UNAUTHORIZED', 'Non authentifié'),
                { status: 401 }
            );
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const { id } = await params;

        // Fetch the source campaign
        const sourceCampaign = await prisma.campaign.findFirst({
            where: { id, workspaceId },
            include: {
                sequence: { select: { id: true, name: true } },
            },
        });

        if (!sourceCampaign) {
            return NextResponse.json(
                error('NOT_FOUND', 'Campagne source non trouvée'),
                { status: 404 }
            );
        }

        // Create the new campaign with prospects in a transaction
        const newCampaign = await prisma.$transaction(async (tx) => {
            // Create the campaign
            const campaign = await tx.campaign.create({
                data: {
                    workspaceId,
                    name: `${sourceCampaign.name} (Copie)`,
                    sequenceId: sourceCampaign.sequenceId,
                    status: CampaignStatus.DRAFT,
                },
                include: {
                    sequence: { select: { id: true, name: true } },
                },
            });

            // Copy prospects from source campaign
            const sourceProspects = await tx.campaignProspect.findMany({
                where: { campaignId: sourceCampaign.id },
                select: { prospectId: true },
            });

            if (sourceProspects.length > 0) {
                await tx.campaignProspect.createMany({
                    data: sourceProspects.map(p => ({
                        campaignId: campaign.id,
                        prospectId: p.prospectId,
                        enrollmentStatus: 'ENROLLED',
                        currentStep: 0,
                    })),
                });
            }

            return campaign;
        });

        return NextResponse.json(success({
            campaign: mapCampaign(newCampaign),
            sourceCampaignId: sourceCampaign.id,
            prospectsCopied: true,
        }), { status: 201 });

    } catch (e) {
        console.error('POST /api/campaigns/[id]/duplicate error:', e);
        return NextResponse.json(
            error('INTERNAL_ERROR', 'Erreur serveur'),
            { status: 500 }
        );
    }
}
