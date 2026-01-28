import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { mapSequenceStep } from '@/lib/prisma/mappers';
import { z } from 'zod';
import { ALLOWED_DELAY_DAYS } from '@/lib/constants/sequences';

// Validation schema for updating a step (Story 4.2 - AC2, Task 7)
const UpdateStepSchema = z.object({
    subject: z.string().min(1).max(200).optional(),
    body: z.string().min(1).optional(),
    delayDays: z.number().int().refine(
        (val) => val === 0 || (ALLOWED_DELAY_DAYS as readonly number[]).includes(val),
        { message: 'Valeur de délai invalide' }
    ).optional(),
});

interface RouteParams {
    params: Promise<{ id: string; stepId: string }>;
}

/**
 * PUT /api/sequences/[id]/steps/[stepId] - Update a step
 * Story 4.1: Sequence Creation (Max 3 Steps) - AC3
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { id: sequenceId, stepId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        // Verify step exists and belongs to the sequence which belongs to workspace
        const step = await prisma.sequenceStep.findFirst({
            where: {
                id: stepId,
                sequenceId,
                sequence: { workspaceId },
            },
        });

        if (!step) {
            return NextResponse.json(error('NOT_FOUND', 'Étape introuvable'), { status: 404 });
        }

        const body = await req.json();
        const parsed = UpdateStepSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        const updateData: { subject?: string; body?: string; delayDays?: number } = {};
        if (parsed.data.subject) updateData.subject = parsed.data.subject.trim();
        if (parsed.data.body) updateData.body = parsed.data.body;
        if (parsed.data.delayDays !== undefined) {
            // Story 4.2 - AC6: Step 1 must always have 0 delay
            if (step.order === 1 && parsed.data.delayDays !== 0) {
                updateData.delayDays = 0;
            } else {
                updateData.delayDays = parsed.data.delayDays;
            }
        }

        const updatedStep = await prisma.sequenceStep.update({
            where: { id: stepId },
            data: updateData,
        });

        return NextResponse.json(success(mapSequenceStep(updatedStep)));
    } catch (e) {
        console.error('PUT /api/sequences/[id]/steps/[stepId] error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

/**
 * DELETE /api/sequences/[id]/steps/[stepId] - Delete a step
 * Story 4.1: Sequence Creation (Max 3 Steps) - AC8
 * 
 * After deletion, reorders remaining steps to maintain sequential order
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id: sequenceId, stepId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        // Verify step exists and belongs to the sequence which belongs to workspace
        const step = await prisma.sequenceStep.findFirst({
            where: {
                id: stepId,
                sequenceId,
                sequence: { workspaceId },
            },
        });

        if (!step) {
            return NextResponse.json(error('NOT_FOUND', 'Étape introuvable'), { status: 404 });
        }

        const deletedOrder = step.order;

        // Delete the step
        await prisma.sequenceStep.delete({
            where: { id: stepId },
        });

        // Reorder remaining steps to fill the gap
        await prisma.sequenceStep.updateMany({
            where: {
                sequenceId,
                order: { gt: deletedOrder },
            },
            data: {
                order: { decrement: 1 },
            },
        });

        return NextResponse.json(success({ deleted: true }));
    } catch (e) {
        console.error('DELETE /api/sequences/[id]/steps/[stepId] error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
