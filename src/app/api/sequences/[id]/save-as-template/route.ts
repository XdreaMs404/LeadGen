/**
 * Save as Template API Endpoint (Story 4.7 - AC1)
 * 
 * POST /api/sequences/[id]/save-as-template
 * Saves a sequence as a reusable template.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { cloneSequence } from '@/lib/sequences/clone-sequence';
import { mapSequence } from '@/lib/prisma/mappers';

// Request body validation schema
const saveAsTemplateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional()
});

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

        // Parse and validate body
        const body = await req.json();
        const parsed = saveAsTemplateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        // Get original sequence to build template name if not provided
        const original = await prisma.sequence.findFirst({
            where: { id, workspaceId }
        });

        if (!original) {
            return NextResponse.json(error('NOT_FOUND', 'Séquence non trouvée'), { status: 404 });
        }

        // Clone as template
        const templateName = parsed.data.name ?? `${original.name} (Modèle)`;

        const template = await cloneSequence(id, workspaceId, {
            newName: templateName,
            description: parsed.data.description,
            isTemplate: true,
            trackSourceTemplate: false // Templates don't track their own source
        });

        // Map to response format
        const response = mapSequence(template);

        return NextResponse.json(success(response), { status: 201 });
    } catch (err) {
        console.error('[API] POST /api/sequences/[id]/save-as-template error:', err);

        if (err instanceof Error) {
            if (err.message === 'Sequence not found') {
                return NextResponse.json(error('NOT_FOUND', 'Séquence non trouvée'), { status: 404 });
            }
            if (err.message === 'Sequence does not belong to this workspace') {
                return NextResponse.json(error('FORBIDDEN', 'Accès non autorisé'), { status: 403 });
            }
        }

        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur lors de la sauvegarde du modèle'), { status: 500 });
    }
}
