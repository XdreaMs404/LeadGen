/**
 * Unread Count API Route (Story 6.3 AC1)
 * 
 * GET: Returns the count of unread inbound messages for the current workspace
 * Used for the inbox badge in navigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';

export async function GET(_request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        // Count unread inbound messages
        const count = await prisma.inboxMessage.count({
            where: {
                conversation: {
                    workspaceId,
                },
                isRead: false,
                direction: 'INBOUND',
            },
        });

        return NextResponse.json(success({ count }));
    } catch (e) {
        console.error('[inbox/unread-count] Error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
