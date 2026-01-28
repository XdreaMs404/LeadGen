import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { mapSequenceStep } from '@/lib/prisma/mappers';
import { z } from 'zod';

import { MAX_STEPS_PER_SEQUENCE, ALLOWED_DELAY_DAYS, DEFAULT_DELAY_DAYS } from '@/lib/constants/sequences';

// Validation schema for creating a step (Story 4.2 - AC2, Task 2)
const CreateStepSchema = z.object({
    subject: z.string().min(1, 'L\'objet est requis').max(200, 'L\'objet ne peut pas dépasser 200 caractères'),
    body: z.string().min(1, 'Le contenu est requis'),
    delayDays: z.number().int().refine(
        (val) => val === 0 || (ALLOWED_DELAY_DAYS as readonly number[]).includes(val),
        { message: 'Valeur de délai invalide' }
    ).optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/sequences/[id]/steps - Add a new step to a sequence
 * Story 4.1: Sequence Creation (Max 3 Steps) - AC2, AC3
 * 
 * Enforces max 3 steps per sequence (AC2)
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
        });

        if (!sequence) {
            return NextResponse.json(error('NOT_FOUND', 'Séquence introuvable'), { status: 404 });
        }

        // Check current step count - enforce max 3 steps (AC2)
        const stepCount = await prisma.sequenceStep.count({
            where: { sequenceId },
        });

        if (stepCount >= MAX_STEPS_PER_SEQUENCE) {
            return NextResponse.json(
                error('MAX_STEPS_REACHED', 'Maximum 3 étapes par séquence'),
                { status: 400 }
            );
        }

        const body = await req.json();
        const parsed = CreateStepSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        const { subject, body: stepBody, delayDays } = parsed.data;

        // Story 4.2 - AC2, AC6: First step always has delay 0, subsequent steps default to DEFAULT_DELAY_DAYS
        const newOrder = stepCount + 1;
        const isFirstStep = newOrder === 1;
        const finalDelayDays = delayDays ?? (isFirstStep ? 0 : DEFAULT_DELAY_DAYS);

        // Create step with next order number
        const step = await prisma.sequenceStep.create({
            data: {
                sequenceId,
                order: newOrder,
                subject: subject.trim(),
                body: stepBody,
                delayDays: finalDelayDays,
            },
        });

        return NextResponse.json(success(mapSequenceStep(step)), { status: 201 });
    } catch (e) {
        console.error('POST /api/sequences/[id]/steps error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
