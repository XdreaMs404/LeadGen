/**
 * Unit tests for Conversation Service (Story 6.2)
 * 
 * Tests:
 * - getConversationWithMessages
 * - getConversationsForProspect
 * - getConversationsForWorkspace
 * - markConversationAsRead
 * - getUnreadCount
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getConversationWithMessages,
    getConversationsForProspect,
    getConversationsForWorkspace,
    markConversationAsRead,
    getUnreadCount,
} from '@/lib/inbox/conversation-service';
import { prisma } from '@/lib/prisma/client';

// Mock Prisma client
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        conversation: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
        },
        inboxMessage: {
            updateMany: vi.fn(),
            count: vi.fn(),
        },
    },
}));

describe('Conversation Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getConversationWithMessages', () => {
        it('should return conversation with messages ordered chronologically', async () => {
            const mockConversation = {
                id: 'conv-1',
                threadId: 'thread-123',
                workspaceId: 'ws-1',
                prospectId: 'prospect-1',
                campaignId: 'campaign-1',
                sequenceId: 'seq-1',
                status: 'OPEN' as const, // Fix type error by casting to literal or enum if imported
                lastMessageAt: new Date('2026-02-09T10:00:00Z'),
                createdAt: new Date('2026-02-09T09:00:00Z'),
                updatedAt: new Date('2026-02-09T10:00:00Z'),
                messages: [
                    {
                        id: 'msg-1',
                        direction: 'OUTBOUND',
                        receivedAt: new Date('2026-02-09T09:00:00Z'),
                    },
                    {
                        id: 'msg-2',
                        direction: 'INBOUND',
                        receivedAt: new Date('2026-02-09T10:00:00Z'),
                    },
                ],
                prospect: {
                    id: 'prospect-1',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    company: 'Acme Inc',
                    title: 'CEO',
                },
                campaign: {
                    id: 'campaign-1',
                    name: 'Q1 Outreach',
                    status: 'RUNNING',
                    sequence: {
                        id: 'seq-1',
                        name: 'Cold Email Sequence',
                    },
                },
            };

            vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation);

            const result = await getConversationWithMessages('conv-1');

            expect(result).toEqual(mockConversation);
            expect(prisma.conversation.findUnique).toHaveBeenCalledWith({
                where: { id: 'conv-1' },
                include: {
                    messages: { orderBy: { receivedAt: 'asc' } },
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
        });

        it('should return null when conversation not found', async () => {
            vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);

            const result = await getConversationWithMessages('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('getConversationsForProspect', () => {
        it('should return all conversations for a prospect across campaigns', async () => {
            const mockConversations = [
                {
                    id: 'conv-1',
                    prospectId: 'prospect-1',
                    campaignId: 'campaign-1',
                    lastMessageAt: new Date('2026-02-09T10:00:00Z'),
                    campaign: { id: 'campaign-1', name: 'Q1 Campaign' },
                    messages: [{ id: 'msg-1' }],
                    // Add missing properties
                    threadId: 'thread-1',
                    workspaceId: 'ws-1',
                    sequenceId: 'seq-1',
                    status: 'OPEN' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'conv-2',
                    prospectId: 'prospect-1',
                    campaignId: 'campaign-2',
                    lastMessageAt: new Date('2026-02-08T10:00:00Z'),
                    campaign: { id: 'campaign-2', name: 'Q2 Campaign' },
                    messages: [{ id: 'msg-2' }],
                    // Add missing properties
                    threadId: 'thread-2',
                    workspaceId: 'ws-1',
                    sequenceId: 'seq-1',
                    status: 'OPEN' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            vi.mocked(prisma.conversation.findMany).mockResolvedValue(mockConversations);

            const result = await getConversationsForProspect('prospect-1');

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('conv-1'); // Most recent first
            expect(prisma.conversation.findMany).toHaveBeenCalledWith({
                where: { prospectId: 'prospect-1' },
                include: {
                    messages: { orderBy: { receivedAt: 'desc' }, take: 1 },
                    campaign: { select: { id: true, name: true } },
                },
                orderBy: { lastMessageAt: 'desc' },
            });
        });
    });

    describe('getConversationsForWorkspace', () => {
        it('should return paginated conversations with filters', async () => {
            const mockConversations = [
                {
                    id: 'conv-1', status: 'OPEN' as const,
                    threadId: 't1', workspaceId: 'ws-1', prospectId: 'p1', campaignId: 'c1', sequenceId: 's1', lastMessageAt: new Date(), createdAt: new Date(), updatedAt: new Date()
                },
                {
                    id: 'conv-2', status: 'OPEN' as const,
                    threadId: 't2', workspaceId: 'ws-1', prospectId: 'p2', campaignId: 'c2', sequenceId: 's2', lastMessageAt: new Date(), createdAt: new Date(), updatedAt: new Date()
                },
            ];

            vi.mocked(prisma.conversation.count).mockResolvedValue(10);
            vi.mocked(prisma.conversation.findMany).mockResolvedValue(mockConversations);

            const result = await getConversationsForWorkspace(
                'ws-1',
                { status: 'OPEN' },
                { skip: 0, take: 20 }
            );

            expect(result.total).toBe(10);
            expect(result.conversations).toHaveLength(2);
            expect(prisma.conversation.count).toHaveBeenCalledWith({
                where: { workspaceId: 'ws-1', status: 'OPEN' },
            });
        });

        it('should filter by unread status', async () => {
            vi.mocked(prisma.conversation.count).mockResolvedValue(5);
            vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

            await getConversationsForWorkspace('ws-1', { hasUnread: true });

            expect(prisma.conversation.count).toHaveBeenCalledWith({
                where: {
                    workspaceId: 'ws-1',
                    messages: {
                        some: {
                            isRead: false,
                            direction: 'INBOUND',
                        },
                    },
                },
            });
        });

        it('should filter by date range', async () => {
            const dateFrom = new Date('2026-02-01');
            const dateTo = new Date('2026-02-28');

            vi.mocked(prisma.conversation.count).mockResolvedValue(3);
            vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

            await getConversationsForWorkspace('ws-1', { dateFrom, dateTo });

            expect(prisma.conversation.count).toHaveBeenCalledWith({
                where: {
                    workspaceId: 'ws-1',
                    lastMessageAt: {
                        gte: dateFrom,
                        lte: dateTo,
                    },
                },
            });
        });

        it('should filter by classification and needs review', async () => {
            vi.mocked(prisma.conversation.count).mockResolvedValue(2);
            vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

            await getConversationsForWorkspace('ws-1', {
                classification: ['INTERESTED'],
                needsReview: true,
            });

            expect(prisma.conversation.count).toHaveBeenCalledWith({
                where: {
                    workspaceId: 'ws-1',
                    messages: {
                        some: {
                            direction: 'INBOUND',
                            classification: { in: ['INTERESTED'] },
                            needsReview: true,
                        },
                    },
                },
            });
        });

        it('should filter by search term on prospect identity fields', async () => {
            vi.mocked(prisma.conversation.count).mockResolvedValue(1);
            vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

            await getConversationsForWorkspace('ws-1', { search: 'john' });

            expect(prisma.conversation.count).toHaveBeenCalledWith({
                where: {
                    workspaceId: 'ws-1',
                    prospect: {
                        OR: [
                            { email: { contains: 'john', mode: 'insensitive' } },
                            { firstName: { contains: 'john', mode: 'insensitive' } },
                            { lastName: { contains: 'john', mode: 'insensitive' } },
                        ],
                    },
                },
            });
        });

        it('should prioritize INTERESTED conversations when sortByPriority=true', async () => {
            vi.mocked(prisma.conversation.count).mockResolvedValue(2);
            vi.mocked(prisma.conversation.findMany).mockResolvedValue([
                {
                    id: 'conv-low',
                    threadId: 'thread-low',
                    workspaceId: 'ws-1',
                    prospectId: 'p-low',
                    campaignId: null,
                    sequenceId: null,
                    status: 'OPEN' as const,
                    lastMessageAt: new Date('2026-02-10T10:00:00Z'),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    messages: [{ classification: 'OTHER' }],
                    _count: { messages: 0 },
                },
                {
                    id: 'conv-int',
                    threadId: 'thread-int',
                    workspaceId: 'ws-1',
                    prospectId: 'p-int',
                    campaignId: null,
                    sequenceId: null,
                    status: 'OPEN' as const,
                    lastMessageAt: new Date('2026-02-10T09:00:00Z'),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    messages: [{ classification: 'INTERESTED' }],
                    _count: { messages: 0 },
                },
            ] as any);

            const result = await getConversationsForWorkspace(
                'ws-1',
                { sortByPriority: true },
                { skip: 0, take: 25 }
            );

            expect(result.conversations[0].id).toBe('conv-int');
        });
    });

    describe('markConversationAsRead', () => {
        it('should mark all unread inbound messages as read', async () => {
            vi.mocked(prisma.inboxMessage.updateMany).mockResolvedValue({ count: 3 });

            const result = await markConversationAsRead('conv-1');

            expect(result).toBe(3);
            expect(prisma.inboxMessage.updateMany).toHaveBeenCalledWith({
                where: {
                    conversationId: 'conv-1',
                    isRead: false,
                    direction: 'INBOUND',
                },
                data: { isRead: true },
            });
        });

        it('should return 0 when no unread messages', async () => {
            vi.mocked(prisma.inboxMessage.updateMany).mockResolvedValue({ count: 0 });

            const result = await markConversationAsRead('conv-1');

            expect(result).toBe(0);
        });
    });

    describe('getUnreadCount', () => {
        it('should return count of unread inbound messages', async () => {
            vi.mocked(prisma.inboxMessage.count).mockResolvedValue(15);

            const result = await getUnreadCount('ws-1');

            expect(result).toBe(15);
            expect(prisma.inboxMessage.count).toHaveBeenCalledWith({
                where: {
                    conversation: { workspaceId: 'ws-1' },
                    isRead: false,
                    direction: 'INBOUND',
                },
            });
        });
    });
});
