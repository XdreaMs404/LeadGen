/**
 * Duplicate Sequence API Endpoint (Story 4.7 - AC3, AC4)
 * 
 * POST /api/sequences/[id]/duplicate
 * Creates an independent copy of the sequence with all steps.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { cloneSequence } from '@/lib/sequences/clone-sequence';
import { mapSequence } from '@/lib/prisma/mappers';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Authenticate user with Supabase
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        // Clone the sequence with "(Copie)" suffix
        const clonedSequence = await cloneSequence(id, workspaceId, {
            isTemplate: false,
            trackSourceTemplate: false
        });

        // Map to response format
        const response = mapSequence(clonedSequence);

        return NextResponse.json(success(response), { status: 201 });
    } catch (err) {
        console.error('[API] POST /api/sequences/[id]/duplicate error:', err);

        if (err instanceof Error) {
            if (err.message === 'Sequence not found') {
                return NextResponse.json(error('NOT_FOUND', 'Séquence non trouvée'), { status: 404 });
            }
            if (err.message === 'Sequence does not belong to this workspace') {
                return NextResponse.json(error('FORBIDDEN', 'Accès non autorisé'), { status: 403 });
            }
        }

        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur lors de la duplication'), { status: 500 });
    }
}
