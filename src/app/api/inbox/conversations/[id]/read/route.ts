/**
 * Mark Conversation as Read API Route (Story 6.3 AC5)
 * 
 * POST: Mark all unread inbound messages in a conversation as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess } from '@/lib/guardrails/workspace-check';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const { id: conversationId } = await params;

        // Get conversation to verify workspace
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { workspaceId: true },
        });

        if (!conversation) {
            return NextResponse.json(error('NOT_FOUND', 'Conversation non trouvée'), { status: 404 });
        }

        // Verify workspace access
        await assertWorkspaceAccess(user.id, conversation.workspaceId);

        // Mark all inbound messages as read
        const result = await prisma.inboxMessage.updateMany({
            where: {
                conversationId,
                isRead: false,
                direction: 'INBOUND',
            },
            data: {
                isRead: true,
            },
        });

        return NextResponse.json(success({ marked: result.count }));
    } catch (e) {
        console.error('[inbox/conversations/[id]/read] Error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
