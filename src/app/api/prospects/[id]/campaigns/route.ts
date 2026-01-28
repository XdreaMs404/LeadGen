/**
 * GET /api/prospects/[id]/campaigns
 * Get active campaigns for a prospect
 * Story 3.6: Active Campaign Warning (AC2)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createClient } from '@/lib/supabase/server';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { success, error } from '@/lib/utils/api-response';
import { getProspectActiveCampaigns } from '@/lib/prospects/get-active-campaigns';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        // Verify prospect exists and belongs to workspace
        const prospect = await prisma.prospect.findUnique({
            where: { id },
            select: { workspaceId: true, deletedAt: true },
        });

        if (!prospect || prospect.workspaceId !== workspaceId) {
            return NextResponse.json(error('NOT_FOUND', 'Prospect non trouvé'), { status: 404 });
        }

        if (prospect.deletedAt) {
            return NextResponse.json(error('NOT_FOUND', 'Prospect non trouvé'), { status: 404 });
        }

        const campaigns = await getProspectActiveCampaigns(id);

        return NextResponse.json(success({ campaigns }));
    } catch (e) {
        console.error('GET /api/prospects/[id]/campaigns error:', e);
        return NextResponse.json(error('SERVER_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
