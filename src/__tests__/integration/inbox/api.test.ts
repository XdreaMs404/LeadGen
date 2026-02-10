
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
                { id: 'c-1', prospect: { email: 'p1@test.com' }, messages: [] },
                { id: 'c-2', prospect: { email: 'p2@test.com' }, messages: [] },
            ];
            vi.mocked(prisma.conversation.findMany).mockResolvedValue(mockConversations as any);
            vi.mocked(prisma.conversation.count).mockResolvedValue(2);

            const req = createRequest('/api/inbox/conversations?page=1&limit=10');
            const res = await getConversations(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.data.conversations).toHaveLength(2);
            expect(json.data.total).toBe(2);
        });

        it('should filter by unread status', async () => {
            vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);
            vi.mocked(prisma.conversation.count).mockResolvedValue(0);

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
    });

    describe('GET /api/inbox/conversations/[id]', () => {
        it('should return conversation details', async () => {
            const mockConv = { id: 'c-1', messages: [{ id: 'm-1' }] };
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
