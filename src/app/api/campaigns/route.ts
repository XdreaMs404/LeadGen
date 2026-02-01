import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { mapCampaign } from '@/lib/prisma/mappers';
import { z } from 'zod';

// Validation schema for creating a campaign - sequenceId is optional at creation
const CreateCampaignSchema = z.object({
    name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
    sequenceId: z.string().optional(), // Optional - set during launch wizard
});

/**
 * GET /api/campaigns - List all campaigns for the workspace
 * Story 5.1: Campaign Entity & Status Model - AC2
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const campaigns = await prisma.campaign.findMany({
            where: { workspaceId },
            include: {
                sequence: { select: { id: true, name: true } },
                _count: { select: { prospects: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(success({
            campaigns: campaigns.map(mapCampaign),
        }));
    } catch (e) {
        console.error('GET /api/campaigns error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

/**
 * POST /api/campaigns - Create a new campaign
 * Story 5.1: Campaign Entity & Status Model - AC1, AC2
 * 
 * Note: sequenceId is now optional at creation. 
 * The sequence is selected during the launch wizard (Story 5.2).
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const body = await req.json();
        const parsed = CreateCampaignSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        const { name, sequenceId } = parsed.data;

        // If sequenceId is provided, verify it exists and belongs to workspace
        if (sequenceId) {
            const sequence = await prisma.sequence.findFirst({
                where: { id: sequenceId, workspaceId },
            });

            if (!sequence) {
                return NextResponse.json(
                    error('NOT_FOUND', 'Séquence non trouvée'),
                    { status: 404 }
                );
            }

            // Validate sequence status if provided
            if (sequence.status !== 'READY') {
                return NextResponse.json(
                    error('VALIDATION_ERROR', 'La séquence doit être prête (status: READY)'),
                    { status: 400 }
                );
            }
        }

        // Create campaign in DRAFT status
        const campaign = await prisma.campaign.create({
            data: {
                workspaceId,
                name: name.trim(),
                ...(sequenceId && { sequenceId }), // Only include if provided
                status: 'DRAFT',
            },
            include: {
                sequence: { select: { id: true, name: true } },
            },
        });


        return NextResponse.json(success(mapCampaign(campaign)), { status: 201 });
    } catch (e) {
        console.error('POST /api/campaigns error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
