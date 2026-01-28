import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { mapSequenceListItem, mapSequence } from '@/lib/prisma/mappers';
import { MAX_STEPS_PER_SEQUENCE } from '@/lib/constants/sequences';
import { z } from 'zod';

// Validation schema for creating a sequence
const CreateSequenceSchema = z.object({
    name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
    steps: z.array(z.object({
        subject: z.string().min(1, 'L\'objet est requis'),
        body: z.string().min(1, 'Le contenu est requis'),
        delayDays: z.number().int().min(0).optional().default(0),
    })).max(MAX_STEPS_PER_SEQUENCE, `Maximum ${MAX_STEPS_PER_SEQUENCE} étapes`).optional(),
});

/**
 * GET /api/sequences - List all sequences for the workspace
 * Story 4.1: Sequence Creation (Max 3 Steps) - AC6
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

        const sequences = await prisma.sequence.findMany({
            where: { workspaceId },
            include: { _count: { select: { steps: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(success({
            sequences: sequences.map(mapSequenceListItem),
        }));
    } catch (e) {
        console.error('GET /api/sequences error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

/**
 * POST /api/sequences - Create a new sequence
 * Story 4.1: Sequence Creation (Max 3 Steps) - AC1, AC4
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
        const parsed = CreateSequenceSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        const { name, steps } = parsed.data;

        // Atomic creation of sequence and steps
        const sequence = await prisma.sequence.create({
            data: {
                workspaceId,
                name: name.trim(),
                status: 'DRAFT',
                steps: steps && steps.length > 0 ? {
                    create: steps.map((step: any, index: number) => ({
                        order: index + 1,
                        subject: step.subject,
                        body: step.body,
                        delayDays: step.delayDays ?? 0,
                    })),
                } : undefined,
            },
            include: { steps: true },
        });

        return NextResponse.json(success(mapSequence(sequence)), { status: 201 });
    } catch (e) {
        console.error('POST /api/sequences error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
