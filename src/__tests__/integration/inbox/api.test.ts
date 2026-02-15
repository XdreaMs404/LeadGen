
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getConversations } from '@/app/api/inbox/conversations/route';
import { GET as getConversation } from '@/app/api/inbox/conversations/[id]/route';
import { POST as markAsRead } from '@/app/api/inbox/conversations/[id]/read/route';
import { GET as getUnreadCount } from '@/app/api/inbox/unread-count/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'user-1' } },
                error: null,
            }),
        },
    }),
}));

vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        workspace: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            findFirst: vi.fn(),
        },
        conversation: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            update: vi.fn(),
        },
        inboxMessage: {
            updateMany: vi.fn(),
            count: vi.fn(),
        },
    },
}));

vi.mock('@/lib/guardrails/workspace-check', () => ({
    getWorkspaceId: vi.fn().mockResolvedValue('ws-1'),
    assertWorkspaceAccess: vi.fn().mockResolvedValue(true),
}));

describe('Inbox API Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    function createRequest(url: string, method = 'GET'): NextRequest {
        return new NextRequest(`http://localhost:3000${url}`, {
            method,
        });
    }

    describe('GET /api/inbox/conversations', () => {
        it('should return paginated conversations', async () => {
            const mockConversations = [
                {
                    id: 'c-1',
                    workspaceId: 'ws-1',
                    threadId: 't-1',
                    prospectId: null,
                    campaignId: null,
                    sequenceId: null,
                    status: 'OPEN',
                    lastMessageAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    prospect: { email: 'p1@test.com', firstName: null, lastName: null, id: 'p1', company: null },
                    campaign: null,
                    messages: [],
                    _count: { messages: 0 },
                },
                {
                    id: 'c-2',
                    workspaceId: 'ws-1',
                    threadId: 't-2',
                    prospectId: null,
                    campaignId: null,
                    sequenceId: null,
                    status: 'OPEN',
                    lastMessageAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    prospect: { email: 'p2@test.com', firstName: null, lastName: null, id: 'p2', company: null },
                    campaign: null,
                    messages: [],
                    _count: { messages: 0 },
                },
            ];
            vi.mocked(prisma.conversation.findMany).mockResolvedValue(mockConversations as any);
            vi.mocked(prisma.conversation.count).mockResolvedValue(2);
            vi.mocked(prisma.inboxMessage.count).mockResolvedValue(3);

            const req = createRequest('/api/inbox/conversations?page=1&limit=10');
            const res = await getConversations(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.data.conversations).toHaveLength(2);
            expect(json.data.total).toBe(2);
            expect(json.data.unreadTotal).toBe(3);
        });

        it('should filter by unread status', async () => {
            vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);
            vi.mocked(prisma.conversation.count).mockResolvedValue(0);
            vi.mocked(prisma.inboxMessage.count).mockResolvedValue(0);

            const req = createRequest('/api/inbox/conversations?unread=true');
            await getConversations(req);

            expect(prisma.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    messages: expect.objectContaining({
                        some: expect.objectContaining({
                            isRead: false,
                            direction: 'INBOUND',
                        })
                    })
                })
            }));
        });

        it('should support classification and needsReview filters', async () => {
            vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);
            vi.mocked(prisma.conversation.count).mockResolvedValue(0);
            vi.mocked(prisma.inboxMessage.count).mockResolvedValue(0);

            const req = createRequest('/api/inbox/conversations?classification=INTERESTED&needsReview=true');
            await getConversations(req);

            expect(prisma.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    messages: expect.objectContaining({
                        some: expect.objectContaining({
                            classification: { in: ['INTERESTED'] },
                            needsReview: true,
                        }),
                    }),
                }),
            }));
        });

        it('should return 400 for invalid classification value', async () => {
            const req = createRequest('/api/inbox/conversations?classification=INVALID_ENUM');
            const res = await getConversations(req);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/inbox/conversations/[id]', () => {
        it('should return conversation details', async () => {
            const mockConv = {
                id: 'c-1',
                workspaceId: 'ws-1',
                threadId: 't-1',
                prospectId: null,
                campaignId: null,
                sequenceId: null,
                status: 'OPEN',
                lastMessageAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                messages: [{ id: 'm-1', direction: 'INBOUND', isRead: true, receivedAt: new Date() }],
                prospect: null,
                campaign: null,
            };
            vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConv as any);

            const req = createRequest('/api/inbox/conversations/c-1');
            const res = await getConversation(req, { params: Promise.resolve({ id: 'c-1' }) });
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.data.conversation.id).toBe('c-1');
        });
    });

    describe('POST /api/inbox/conversations/[id]/read', () => {
        it('should mark messages as read', async () => {
            vi.mocked(prisma.conversation.findUnique).mockResolvedValue({ workspaceId: 'ws-1' } as any);
            vi.mocked(prisma.inboxMessage.updateMany).mockResolvedValue({ count: 5 });

            const req = createRequest('/api/inbox/conversations/c-1/read', 'POST');
            const res = await markAsRead(req, { params: Promise.resolve({ id: 'c-1' }) });
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.success).toBe(true);
            expect(prisma.inboxMessage.updateMany).toHaveBeenCalledWith({
                where: {
                    conversationId: 'c-1',
                    isRead: false,
                    direction: 'INBOUND',
                },
                data: { isRead: true },
            });
        });
    });

    describe('GET /api/inbox/unread-count', () => {
        it('should return total unread count', async () => {
            vi.mocked(prisma.inboxMessage.count).mockResolvedValue(12);

            const req = createRequest('/api/inbox/unread-count');
            const res = await getUnreadCount(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.data.count).toBe(12);
        });
    });
});
