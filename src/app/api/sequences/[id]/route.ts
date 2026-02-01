import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { mapSequence } from '@/lib/prisma/mappers';
import { z } from 'zod';
import { SequenceStatus } from '@prisma/client';

// Validation schema for updating a sequence
const UpdateSequenceSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    status: z.enum(['DRAFT', 'READY', 'ARCHIVED']).optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/sequences/[id] - Get a single sequence with its steps
 * Story 4.1: Sequence Creation (Max 3 Steps) - AC1, AC3
 */
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

        const sequence = await prisma.sequence.findFirst({
            where: { id, workspaceId },
            include: {
                steps: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!sequence) {
            return NextResponse.json(error('NOT_FOUND', 'Séquence introuvable'), { status: 404 });
        }

        return NextResponse.json(success(mapSequence(sequence)));
    } catch (e) {
        console.error('GET /api/sequences/[id] error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

/**
 * PUT /api/sequences/[id] - Update a sequence (name, status)
 * Story 4.1: Sequence Creation (Max 3 Steps) - AC4
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const body = await req.json();
        const parsed = UpdateSequenceSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        // Verify sequence exists and belongs to workspace
        const existing = await prisma.sequence.findFirst({
            where: { id, workspaceId },
        });

        if (!existing) {
            return NextResponse.json(error('NOT_FOUND', 'Séquence introuvable'), { status: 404 });
        }

        const updateData: { name?: string; status?: SequenceStatus } = {};
        if (parsed.data.name) updateData.name = parsed.data.name.trim();
        if (parsed.data.status) updateData.status = parsed.data.status as SequenceStatus;

        const sequence = await prisma.sequence.update({
            where: { id },
            data: updateData,
            include: { steps: { orderBy: { order: 'asc' } } },
        });

        return NextResponse.json(success(mapSequence(sequence)));
    } catch (e) {
        console.error('PUT /api/sequences/[id] error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

/**
 * DELETE /api/sequences/[id] - Delete a sequence (and cascade steps)
 * Story 4.1: Sequence Creation (Max 3 Steps)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        // Verify sequence exists and belongs to workspace
        const existing = await prisma.sequence.findFirst({
            where: { id, workspaceId },
        });

        if (!existing) {
            return NextResponse.json(error('NOT_FOUND', 'Séquence introuvable'), { status: 404 });
        }

        // Cascade delete handled by Prisma schema (onDelete: Cascade on SequenceStep)
        await prisma.sequence.delete({
            where: { id },
        });

        return NextResponse.json(success({ deleted: true }));
    } catch (e) {
        console.error('DELETE /api/sequences/[id] error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

// Schema for approve action
const ApproveSequenceSchema = z.object({
    status: z.literal('READY'),
});

/**
 * PATCH /api/sequences/[id] - Approve a sequence (set status to READY)
 * Story 4.5: Copilot Email Preview (Mandatory) - AC4
 * 
 * This endpoint validates that:
 * - Sequence exists and belongs to workspace
 * - Sequence has at least one step
 * - Then sets status to READY
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const body = await req.json();
        const parsed = ApproveSequenceSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        // Verify sequence exists, belongs to workspace, and has steps
        const existing = await prisma.sequence.findFirst({
            where: { id, workspaceId },
            include: {
                _count: {
                    select: { steps: true },
                },
            },
        });

        if (!existing) {
            return NextResponse.json(error('NOT_FOUND', 'Séquence introuvable'), { status: 404 });
        }

        // Story 4.5 AC4: Only sequences with steps can be set to READY
        if (existing._count.steps === 0) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Impossible d\'approuver une séquence sans étapes'),
                { status: 400 }
            );
        }

        const sequence = await prisma.sequence.update({
            where: { id },
            data: { status: 'READY' },
            include: { steps: { orderBy: { order: 'asc' } } },
        });

        return NextResponse.json(success(mapSequence(sequence)));
    } catch (e) {
        console.error('PATCH /api/sequences/[id] error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

