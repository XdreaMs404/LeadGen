/**
 * Inbox Conversations API Route (Story 6.3 AC1, AC4, AC8)
 * 
 * GET: Returns paginated conversations for the current workspace
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 25)
 * - classification: Filter by classification (comma-separated)
 * - unread: Filter by unread (true/false)
 * - needsReview: Filter by needs review (true/false)
 * - sortByPriority: Prioritize INTERESTED conversations first (true/false, default true)
 * - search: Search by prospect name/email
 * - dateFrom: Filter by date from
 * - dateTo: Filter by date to
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { ConversationStatus, ReplyClassification } from '@prisma/client';
import { getConversationsForWorkspace, getUnreadCount } from '@/lib/inbox/conversation-service';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        // Parse query params
        const searchParams = request.nextUrl.searchParams;
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
        const classificationParam = searchParams.get('classification');
        const unread = searchParams.get('unread') === 'true';
        const needsReview = searchParams.get('needsReview') === 'true';
        const sortByPriority = searchParams.get('sortByPriority') !== 'false';
        const statusParam = searchParams.get('status');
        const search = searchParams.get('search')?.trim();
        const dateFromParam = searchParams.get('dateFrom');
        const dateToParam = searchParams.get('dateTo');

        let status: ConversationStatus | undefined;
        if (statusParam) {
            if (!Object.values(ConversationStatus).includes(statusParam as ConversationStatus)) {
                return NextResponse.json(
                    error('BAD_REQUEST', `Status invalide: ${statusParam}`),
                    { status: 400 }
                );
            }
            status = statusParam as ConversationStatus;
        }

        let classifications: ReplyClassification[] | undefined;
        if (classificationParam) {
            const parsed = classificationParam
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean);

            const invalid = parsed.filter(
                (value) => !Object.values(ReplyClassification).includes(value as ReplyClassification)
            );
            if (invalid.length > 0) {
                return NextResponse.json(
                    error('BAD_REQUEST', `Classification invalide: ${invalid.join(', ')}`),
                    { status: 400 }
                );
            }

            if (parsed.length > 0) {
                classifications = parsed as ReplyClassification[];
            }
        }

        let dateFrom: Date | undefined;
        if (dateFromParam) {
            dateFrom = new Date(dateFromParam);
            if (Number.isNaN(dateFrom.getTime())) {
                return NextResponse.json(
                    error('BAD_REQUEST', `dateFrom invalide: ${dateFromParam}`),
                    { status: 400 }
                );
            }
        }

        let dateTo: Date | undefined;
        if (dateToParam) {
            dateTo = new Date(dateToParam);
            if (Number.isNaN(dateTo.getTime())) {
                return NextResponse.json(
                    error('BAD_REQUEST', `dateTo invalide: ${dateToParam}`),
                    { status: 400 }
                );
            }
        }

        const { conversations, total } = await getConversationsForWorkspace(
            workspaceId,
            {
                status,
                hasUnread: unread,
                classification: classifications,
                needsReview,
                sortByPriority,
                search,
                dateFrom,
                dateTo,
            },
            {
                skip: (page - 1) * limit,
                take: limit,
            }
        );
        const normalizedConversations = conversations.map((conversation) => ({
            ...conversation,
            lastMessage: conversation.messages?.[0] ?? null,
            unreadCount: conversation._count?.messages ?? 0,
        }));
        const unreadTotal = await getUnreadCount(workspaceId);

        return NextResponse.json(
            success({
                conversations: normalizedConversations,
                total,
                page,
                limit,
                unreadTotal,
            })
        );
    } catch (e) {
        console.error('[inbox/conversations] Error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
