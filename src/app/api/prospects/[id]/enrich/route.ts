/**
 * Re-Enrich API Endpoint
 * POST /api/prospects/[id]/enrich
 * Story 3.5 - AC8: Manual Re-Enrichment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { queueEnrichment } from '@/lib/enrichment/enrichment-service';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const { id: prospectId } = await params;

        // Find prospect and verify ownership
        const prospect = await prisma.prospect.findFirst({
            where: {
                id: prospectId,
                workspaceId,
            },
        });

        if (!prospect) {
            return NextResponse.json(
                error('NOT_FOUND', 'Prospect non trouvé'),
                { status: 404 }
            );
        }

        // Block re-enrichment for deleted prospects (Story 3.6 - AC6)
        if (prospect.deletedAt) {
            return NextResponse.json(
                error('PROSPECT_DELETED', 'Prospect supprimé'),
                { status: 400 }
            );
        }

        // Only allow re-enrichment for NEEDS_REVIEW or NOT_VERIFIED status
        const allowedStatuses = ['NEEDS_REVIEW', 'NOT_VERIFIED'];
        if (!allowedStatuses.includes(prospect.status)) {
            return NextResponse.json(
                error(
                    'INVALID_STATUS',
                    `Relance impossible : le statut actuel est "${prospect.status}". Seuls les prospects avec statut "NEEDS_REVIEW" ou "NOT_VERIFIED" peuvent être relancés.`
                ),
                { status: 400 }
            );
        }

        // Update prospect status to ENRICHING
        await prisma.prospect.update({
            where: { id: prospectId },
            data: { status: 'ENRICHING' },
        });

        // Queue new enrichment job
        const job = await queueEnrichment(prospectId, workspaceId);

        console.log(`[Enrich] Re-enrichment queued for prospect ${prospectId}, job ${job.id}`);

        return NextResponse.json(
            success({
                message: 'Enrichissement relancé avec succès',
                jobId: job.id,
                prospectId,
            })
        );
    } catch (e) {
        console.error('POST /api/prospects/[id]/enrich error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
