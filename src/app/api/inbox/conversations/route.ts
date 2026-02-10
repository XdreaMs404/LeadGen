/**
 * Inbox Conversations API Route (Story 6.3 AC1, AC4, AC8)
 * 
 * GET: Returns paginated conversations for the current workspace
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 25)
 * - classification: Filter by classification (comma-separated)
 * - unread: Filter by unread (true/false)
 * - search: Search by prospect name/email
 * - dateFrom: Filter by date from
 * - dateTo: Filter by date to
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import type { Prisma, ReplyClassification } from '@prisma/client';

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
        const search = searchParams.get('search')?.trim();
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        // Build where clause
        const where: Prisma.ConversationWhereInput = {
            workspaceId,
        };

        // Classification filter
        if (classificationParam) {
            const classifications = classificationParam.split(',') as ReplyClassification[];
            where.messages = {
                some: {
                    classification: { in: classifications },
                },
            };
        }

        // Unread filter
        if (unread) {
            where.messages = {
                ...where.messages as Prisma.InboxMessageListRelationFilter,
                some: {
                    ...(where.messages as Prisma.InboxMessageListRelationFilter | undefined)?.some,
                    isRead: false,
                    direction: 'INBOUND',
                },
            };
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.lastMessageAt = {};
            if (dateFrom) {
                where.lastMessageAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                where.lastMessageAt.lte = new Date(dateTo);
            }
        }

        // Search filter (by prospect email or name)
        if (search) {
            where.prospect = {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        // Get total count
        const total = await prisma.conversation.count({ where });

        // Get conversations with relations
        const conversations = await prisma.conversation.findMany({
            where,
            include: {
                prospect: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        company: true,
                    },
                },
                campaign: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                messages: {
                    orderBy: { receivedAt: 'desc' },
                    take: 1, // Latest message for preview
                },
                _count: {
                    select: {
                        messages: {
                            where: {
                                isRead: false,
                                direction: 'INBOUND',
                            },
                        },
                    },
                },
            },
            orderBy: { lastMessageAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return NextResponse.json(
            success({
                conversations,
                total,
                page,
                limit,
            })
        );
    } catch (e) {
        console.error('[inbox/conversations] Error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
