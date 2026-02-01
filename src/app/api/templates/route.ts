/**
 * Templates List API Endpoint (Story 4.7 - AC2)
 * 
 * GET /api/templates
 * Returns all templates for the workspace.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { mapSequenceListItem } from '@/lib/prisma/mappers';

export async function GET() {
    try {
        // Authenticate user with Supabase
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);

        // Fetch all templates with step counts
        const templates = await prisma.sequence.findMany({
            where: {
                workspaceId,
                isTemplate: true
            },
            include: {
                _count: {
                    select: { steps: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map to response format
        const response = templates.map(mapSequenceListItem);

        return NextResponse.json(success({ templates: response }), { status: 200 });
    } catch (err) {
        console.error('[API] GET /api/templates error:', err);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur lors de la récupération des modèles'), { status: 500 });
    }
}
