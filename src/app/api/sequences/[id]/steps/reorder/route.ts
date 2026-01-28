import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { z } from 'zod';

// Validation schema for reordering steps
const ReorderStepsSchema = z.object({
    stepIds: z.array(z.string()).min(1, 'Au moins une étape requise').max(3, 'Maximum 3 étapes'),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/sequences/[id]/steps/reorder - Reorder steps in a sequence
 * Story 4.1: Sequence Creation (Max 3 Steps) - AC7
 * 
 * Accepts array of step IDs in desired order
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id: sequenceId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        // Verify sequence exists and belongs to workspace
        const sequence = await prisma.sequence.findFirst({
            where: { id: sequenceId, workspaceId },
            include: { steps: true },
        });

        if (!sequence) {
            return NextResponse.json(error('NOT_FOUND', 'Séquence introuvable'), { status: 404 });
        }

        const body = await req.json();
        const parsed = ReorderStepsSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        const { stepIds } = parsed.data;

        // Verify all stepIds belong to this sequence
        const existingStepIds = new Set(sequence.steps.map(s => s.id));
        const allStepsValid = stepIds.every(id => existingStepIds.has(id));

        if (!allStepsValid || stepIds.length !== sequence.steps.length) {
            return NextResponse.json(
                error('INVALID_STEP_IDS', 'Les identifiants d\'étapes ne correspondent pas à la séquence'),
                { status: 400 }
            );
        }

        // Update order for each step using transaction
        // Use temporary negative order values to avoid unique constraint conflicts
        await prisma.$transaction(async (tx) => {
            // First, set all orders to negative (temporary)
            for (let i = 0; i < stepIds.length; i++) {
                await tx.sequenceStep.update({
                    where: { id: stepIds[i] },
                    data: { order: -(i + 1) },
                });
            }

            // Then set to positive final order
            for (let i = 0; i < stepIds.length; i++) {
                await tx.sequenceStep.update({
                    where: { id: stepIds[i] },
                    data: { order: i + 1 },
                });
            }
        });

        return NextResponse.json(success({ reordered: true }));
    } catch (e) {
        console.error('POST /api/sequences/[id]/steps/reorder error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
