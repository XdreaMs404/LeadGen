import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { mapCampaign } from '@/lib/prisma/mappers';
import { z } from 'zod';
import { CampaignStatus } from '@prisma/client';

// Validation schema for updating a campaign
const UpdateCampaignSchema = z.object({
    name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/campaigns/[id] - Get campaign details with enrollment counts
 * Story 5.1: Campaign Entity & Status Model - AC1, AC3
 */
export async function GET(
    _req: NextRequest,
    { params }: RouteParams
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const { id } = await params;

        const campaign = await prisma.campaign.findFirst({
            where: { id, workspaceId },
            include: {
                sequence: { select: { id: true, name: true } },
                prospects: { select: { enrollmentStatus: true } },
            },
        });

        if (!campaign) {
            return NextResponse.json(
                error('NOT_FOUND', 'Campagne non trouvée'),
                { status: 404 }
            );
        }

        return NextResponse.json(success(mapCampaign(campaign)));
    } catch (e) {
        console.error('GET /api/campaigns/[id] error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

/**
 * PATCH /api/campaigns/[id] - Update campaign name
 * Story 5.1: Campaign Entity & Status Model - AC1
 */
export async function PATCH(
    req: NextRequest,
    { params }: RouteParams
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const { id } = await params;
        const body = await req.json();
        const parsed = UpdateCampaignSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        // Check campaign exists and belongs to workspace
        const existingCampaign = await prisma.campaign.findFirst({
            where: { id, workspaceId },
        });

        if (!existingCampaign) {
            return NextResponse.json(
                error('NOT_FOUND', 'Campagne non trouvée'),
                { status: 404 }
            );
        }

        const updated = await prisma.campaign.update({
            where: { id },
            data: { name: parsed.data.name.trim() },
            include: {
                sequence: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(success(mapCampaign(updated)));
    } catch (e) {
        console.error('PATCH /api/campaigns/[id] error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

/**
 * DELETE /api/campaigns/[id] - Delete a campaign (only if DRAFT)
 * Story 5.1: Campaign Entity & Status Model - AC1
 */
export async function DELETE(
    _req: NextRequest,
    { params }: RouteParams
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const { id } = await params;

        // Check campaign exists, belongs to workspace, and is in DRAFT status
        const campaign = await prisma.campaign.findFirst({
            where: { id, workspaceId },
        });

        if (!campaign) {
            return NextResponse.json(
                error('NOT_FOUND', 'Campagne non trouvée'),
                { status: 404 }
            );
        }

        if (campaign.status !== CampaignStatus.DRAFT) {
            return NextResponse.json(
                error('FORBIDDEN', 'Seules les campagnes en brouillon peuvent être supprimées'),
                { status: 403 }
            );
        }

        await prisma.campaign.delete({
            where: { id },
        });

        return NextResponse.json(success({ deleted: true }));
    } catch (e) {
        console.error('DELETE /api/campaigns/[id] error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
