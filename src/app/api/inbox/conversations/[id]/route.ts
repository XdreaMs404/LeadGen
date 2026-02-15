/**
 * Inbox Conversation Detail API Route (Story 6.3 AC3, AC5)
 * 
 * GET: Returns single conversation with all messages
 * PATCH: Backward-compatible alias to mark conversation as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess } from '@/lib/guardrails/workspace-check';
import { getConversationWithMessages, markConversationAsRead } from '@/lib/inbox/conversation-service';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const { id: conversationId } = await params;

        const conversation = await getConversationWithMessages(conversationId);

        if (!conversation) {
            return NextResponse.json(error('NOT_FOUND', 'Conversation non trouvée'), { status: 404 });
        }

        // Verify workspace access
        await assertWorkspaceAccess(user.id, conversation.workspaceId);

        return NextResponse.json(success({ conversation }));
    } catch (e) {
        console.error('[inbox/conversations/[id]] Error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const { id: conversationId } = await params;

        const conversation = await getConversationWithMessages(conversationId);

        if (!conversation) {
            return NextResponse.json(error('NOT_FOUND', 'Conversation non trouvée'), { status: 404 });
        }

        // Verify workspace access
        await assertWorkspaceAccess(user.id, conversation.workspaceId);

        const marked = await markConversationAsRead(conversationId);

        return NextResponse.json(success({ marked }));
    } catch (e) {
        console.error('[inbox/conversations/[id]] PATCH Error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
