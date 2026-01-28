/**
 * POST /api/prospects/bulk-delete
 * Bulk soft delete prospects with cascade
 * Story 3.6: Bulk Delete (AC5)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma/client';
import { createClient } from '@/lib/supabase/server';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { success, error } from '@/lib/utils/api-response';
import { cascadeDeleteProspects } from '@/lib/prospects/cascade-delete-service';
import { logBulkProspectDeletion } from '@/lib/audit/audit-service';

const BulkDeleteSchema = z.object({
    prospectIds: z.array(z.string().cuid()).min(1).max(100),
});

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
        const parsed = BulkDeleteSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        const { prospectIds } = parsed.data;

        // Verify all prospects belong to workspace and are not already deleted
        const prospects = await prisma.prospect.findMany({
            where: {
                id: { in: prospectIds },
                workspaceId,
                deletedAt: null,
            },
            select: { id: true },
        });

        if (prospects.length === 0) {
            return NextResponse.json(
                error('INVALID_IDS', 'Aucun prospect valide à supprimer'),
                { status: 400 }
            );
        }

        const validIds = prospects.map(p => p.id);
        const skipped = prospectIds.length - validIds.length;

        // Process all deletions in single transaction (AC5)
        const cascadeSummary = await prisma.$transaction(async (tx) => {
            // 1. Cascade cleanup for all prospects
            const summary = await cascadeDeleteProspects(validIds, user.id, tx);

            // 2. Bulk soft delete
            await tx.prospect.updateMany({
                where: { id: { in: validIds } },
                data: {
                    deletedAt: new Date(),
                    deletedBy: user.id,
                },
            });

            return summary;
        });

        // Audit log (outside transaction - non-critical)
        await logBulkProspectDeletion(validIds, user.id, workspaceId, cascadeSummary);

        return NextResponse.json(success({
            deleted: validIds.length,
            skipped,
            cascade: cascadeSummary,
        }));
    } catch (e) {
        console.error('POST /api/prospects/bulk-delete error:', e);
        return NextResponse.json(error('SERVER_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
