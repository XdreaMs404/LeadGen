/**
 * Conversation Query Service (Story 6.2)
 * 
 * Provides query functions for conversations and messages
 * Used by inbox UI and prospect detail pages
 */

import { prisma } from '@/lib/prisma/client';
import type { ConversationStatus, Prisma } from '@prisma/client';

/**
 * Filters for conversation queries
 */
export interface ConversationFilters {
    status?: ConversationStatus;
    hasUnread?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
}

/**
 * Pagination options for conversation list
 */
export interface PaginationOptions {
    skip?: number;
    take?: number;
}

/**
 * Result of paginated conversation query
 */
export interface PaginatedConversations<T> {
    conversations: T[];
    total: number;
}

/**
 * Get a single conversation with all messages in chronological order
 * Includes prospect info and campaign/sequence context (AC3)
 * 
 * @param conversationId - The conversation ID
 * @returns Conversation with all related data, or null if not found
 */
export async function getConversationWithMessages(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            messages: {
                orderBy: { receivedAt: 'asc' },
            },
            prospect: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    company: true,
                    title: true,
                },
            },
            campaign: {
                select: {
                    id: true,
                    name: true,
                    status: true,
                    sequence: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });

    return conversation;
}

/**
 * Get all conversations for a specific prospect across all campaigns (AC4)
 * Each campaign/thread creates a separate conversation
 * 
 * @param prospectId - The prospect ID
 * @returns Array of conversations for this prospect
 */
export async function getConversationsForProspect(prospectId: string) {
    const conversations = await prisma.conversation.findMany({
        where: { prospectId },
        include: {
            messages: {
                orderBy: { receivedAt: 'desc' }, // Get latest message for preview
                take: 1,
            },
            campaign: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { lastMessageAt: 'desc' },
    });

    return conversations;
}

/**
 * Get paginated list of conversations for a workspace with filters
 * Used by unified inbox UI (AC3)
 * 
 * @param workspaceId - The workspace ID
 * @param filters - Optional filters (status, unread, date range)
 * @param pagination - Pagination options
 * @returns Paginated list of conversations with prospect/campaign info
 */
export async function getConversationsForWorkspace(
    workspaceId: string,
    filters?: ConversationFilters,
    pagination?: PaginationOptions
) {
    // Build WHERE clause
    const where: Prisma.ConversationWhereInput = {
        workspaceId,
    };

    if (filters?.status) {
        where.status = filters.status;
    }

    if (filters?.hasUnread) {
        where.messages = {
            some: {
                isRead: false,
                direction: 'INBOUND', // Only count unread inbound messages
            },
        };
    }

    if (filters?.dateFrom || filters?.dateTo) {
        where.lastMessageAt = {};
        if (filters.dateFrom) {
            where.lastMessageAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
            where.lastMessageAt.lte = filters.dateTo;
        }
    }

    // Get total count
    const total = await prisma.conversation.count({ where });

    // Get conversations with related data
    const conversations = await prisma.conversation.findMany({
        where,
        include: {
            prospect: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
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
        skip: pagination?.skip ?? 0,
        take: pagination?.take ?? 20,
    });

    return {
        conversations,
        total,
    };
}

/**
 * Mark all messages in a conversation as read
 * 
 * @param conversationId - The conversation ID
 * @returns Count of messages marked as read
 */
export async function markConversationAsRead(conversationId: string) {
    const result = await prisma.inboxMessage.updateMany({
        where: {
            conversationId,
            isRead: false,
            direction: 'INBOUND', // Only mark inbound messages as read
        },
        data: {
            isRead: true,
        },
    });

    return result.count;
}

/**
 * Get unread message count for a workspace
 * Used for inbox badge/notification
 * 
 * @param workspaceId - The workspace ID
 * @returns Count of unread inbound messages
 */
export async function getUnreadCount(workspaceId: string) {
    const count = await prisma.inboxMessage.count({
        where: {
            conversation: {
                workspaceId,
            },
            isRead: false,
            direction: 'INBOUND',
        },
    });

    return count;
}
