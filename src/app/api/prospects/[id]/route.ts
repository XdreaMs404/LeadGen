/**
 * GET /api/prospects/[id] - Get single prospect
 * DELETE /api/prospects/[id] - Soft delete prospect with cascade
 * Story 3.6: Prospect Deletion with Cascade
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createClient } from '@/lib/supabase/server';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { success, error } from '@/lib/utils/api-response';
import { mapProspect } from '@/lib/prisma/mappers';
import { cascadeDeleteProspect } from '@/lib/prospects/cascade-delete-service';
import { logProspectDeletion } from '@/lib/audit/audit-service';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/prospects/[id]
 * Returns 404 if prospect is soft-deleted
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

        const prospect = await prisma.prospect.findUnique({
            where: { id },
        });

        if (!prospect || prospect.workspaceId !== workspaceId) {
            return NextResponse.json(error('NOT_FOUND', 'Prospect non trouvé'), { status: 404 });
        }

        // Return 404 if soft-deleted (AC1)
        if (prospect.deletedAt) {
            return NextResponse.json(error('NOT_FOUND', 'Prospect non trouvé'), { status: 404 });
        }

        return NextResponse.json(success(mapProspect(prospect)));
    } catch (e) {
        console.error('GET /api/prospects/[id] error:', e);
        return NextResponse.json(error('SERVER_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

/**
 * DELETE /api/prospects/[id]
 * Soft delete prospect with cascade cleanup (AC1, AC3, AC4)
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

        const prospect = await prisma.prospect.findUnique({
            where: { id },
        });

        if (!prospect || prospect.workspaceId !== workspaceId) {
            return NextResponse.json(error('NOT_FOUND', 'Prospect non trouvé'), { status: 404 });
        }

        if (prospect.deletedAt) {
            return NextResponse.json(error('ALREADY_DELETED', 'Prospect déjà supprimé'), { status: 400 });
        }

        // Use transaction for atomicity (AC3)
        const cascadeSummary = await prisma.$transaction(async (tx) => {
            // 1. Cascade cleanup
            const summary = await cascadeDeleteProspect(id, user.id, tx);

            // 2. Soft delete prospect
            await tx.prospect.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    deletedBy: user.id,
                },
            });

            return summary;
        });

        // 3. Audit log (outside transaction - non-critical)
        await logProspectDeletion(id, user.id, workspaceId, cascadeSummary);

        return NextResponse.json(success({
            deleted: true,
            cascade: cascadeSummary,
        }));
    } catch (e) {
        console.error('DELETE /api/prospects/[id] error:', e);
        return NextResponse.json(error('SERVER_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
