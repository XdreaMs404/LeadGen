/**
 * Create Sequence from Template API Endpoint (Story 4.7 - AC2)
 * 
 * POST /api/templates/[id]/create-sequence
 * Creates a new sequence from a template.
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
const createFromTemplateSchema = z.object({
    name: z.string().min(1).max(100).optional()
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id: templateId } = await params;

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
        const parsed = createFromTemplateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        // Verify the template exists and is indeed a template
        const template = await prisma.sequence.findFirst({
            where: { id: templateId, workspaceId }
        });

        if (!template) {
            return NextResponse.json(error('NOT_FOUND', 'Modèle non trouvé'), { status: 404 });
        }

        if (!template.isTemplate) {
            return NextResponse.json(
                error('INVALID_OPERATION', 'Cette séquence n\'est pas un modèle'),
                { status: 400 }
            );
        }

        // Clone from template with "(Copie)" suffix
        const newName = parsed.data.name ?? `${template.name} (Copie)`;

        const newSequence = await cloneSequence(templateId, workspaceId, {
            newName,
            isTemplate: false,
            trackSourceTemplate: true // Track that this was created from a template
        });

        // Map to response format
        const response = mapSequence(newSequence);

        return NextResponse.json(success(response), { status: 201 });
    } catch (err) {
        console.error('[API] POST /api/templates/[id]/create-sequence error:', err);

        if (err instanceof Error) {
            if (err.message === 'Sequence not found') {
                return NextResponse.json(error('NOT_FOUND', 'Modèle non trouvé'), { status: 404 });
            }
            if (err.message === 'Sequence does not belong to this workspace') {
                return NextResponse.json(error('FORBIDDEN', 'Accès non autorisé'), { status: 403 });
            }
        }

        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur lors de la création de la séquence'), { status: 500 });
    }
}
