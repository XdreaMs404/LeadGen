import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { syncWorkspaceInbox } from '@/lib/inbox/sync-worker';
import { GET as getConversations } from '@/app/api/inbox/conversations/route';
import { llmProvider } from '@/lib/llm';
import { prisma } from '@/lib/prisma/client';
import { handleClassificationActions } from '@/lib/inbox/classification/auto-actions';
import {
    createInboxMessage,
    createOrUpdateConversation,
    findCampaignProspect,
    markProspectAsReplied,
    matchThreadToSentEmail,
} from '@/lib/inbox/thread-matcher';
import { fetchMessageDetails, fetchNewMessages } from '@/lib/gmail/inbox-sync';

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

vi.mock('@/lib/guardrails/workspace-check', () => ({
    getWorkspaceId: vi.fn().mockResolvedValue('ws-1'),
    assertWorkspaceAccess: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/crypto/encrypt', () => ({
    decrypt: vi.fn(() => 'access-token'),
}));

vi.mock('@/lib/llm', () => ({
    llmProvider: {
        classifyReply: vi.fn(),
    },
}));

vi.mock('@/lib/gmail/inbox-sync', () => ({
    fetchNewMessages: vi.fn(),
    fetchMessageDetails: vi.fn(),
    isInboundMessage: vi.fn(() => true),
    isAuthError: vi.fn(() => false),
}));

vi.mock('@/lib/inbox/classification/auto-actions', () => ({
    handleClassificationActions: vi.fn(),
}));

vi.mock('@/lib/inbox/thread-matcher', () => ({
    matchThreadToSentEmail: vi.fn(),
    createOrUpdateConversation: vi.fn(),
    createInboxMessage: vi.fn(),
    markProspectAsReplied: vi.fn(),
    findCampaignProspect: vi.fn(),
    findProspectByEmail: vi.fn(),
}));

vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        workspace: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
        },
        gmailToken: {
            update: vi.fn(),
        },
        scheduledEmail: {
            findUnique: vi.fn(),
        },
        inboxMessage: {
            update: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
        },
        conversation: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
    },
}));

function createRequest(url: string): NextRequest {
    return new NextRequest(`http://localhost:3000${url}`, { method: 'GET' });
}

describe('Inbox Classification Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
            id: 'ws-1',
            lastSyncedAt: new Date('2026-02-15T00:00:00Z'),
            gmailToken: {
                accessToken: 'encrypted',
                email: 'sender@leadgen.com',
            },
        } as any);
        vi.mocked(prisma.workspace.update).mockResolvedValue({} as any);
        vi.mocked(prisma.scheduledEmail.findUnique).mockResolvedValue({ sequenceId: 'seq-1' } as any);
        vi.mocked(prisma.inboxMessage.findMany).mockResolvedValue([]);
    });

    it('classifies inbound message during sync with mocked LLM', async () => {
        vi.mocked(fetchNewMessages).mockResolvedValue([{ id: 'gmail-1', threadId: 'thread-1' }] as any);
        vi.mocked(fetchMessageDetails).mockResolvedValue({
            id: 'gmail-1',
            threadId: 'thread-1',
            internalDate: `${Date.now()}`,
            headers: {
                from: 'Prospect <prospect@example.com>',
                to: 'sender@leadgen.com',
                subject: 'Re: Intro',
                date: 'Mon, 10 Feb 2026 10:00:00 +0000',
                messageId: '<msg-1>',
            },
            body: {
                raw: 'Can we schedule a call this week?',
                cleaned: 'Can we schedule a call this week?',
            },
            labelIds: [],
            snippet: '',
        } as any);

        vi.mocked(matchThreadToSentEmail).mockResolvedValue({
            id: 'sent-1',
            scheduledEmailId: 'sched-1',
            prospectId: 'prospect-1',
            campaignId: 'campaign-1',
        } as any);
        vi.mocked(createOrUpdateConversation).mockResolvedValue({ id: 'conv-1' } as any);
        vi.mocked(createInboxMessage).mockResolvedValue({
            id: 'inbox-1',
            conversationId: 'conv-1',
            direction: 'INBOUND',
            subject: 'Re: Intro',
            bodyRaw: 'Can we schedule a call this week?',
            bodyCleaned: 'Can we schedule a call this week?',
        } as any);
        vi.mocked(findCampaignProspect).mockResolvedValue({ id: 'cp-1', enrollmentStatus: 'ENROLLED' } as any);
        vi.mocked(llmProvider.classifyReply).mockResolvedValue({
            classification: 'INTERESTED',
            confidence: 95,
            reasoning: 'The prospect asks for a call.',
        });

        const result = await syncWorkspaceInbox('ws-1');

        expect(result.processed).toBe(1);
        expect(prisma.inboxMessage.update).toHaveBeenCalledWith({
            where: { id: 'inbox-1' },
            data: {
                classification: 'INTERESTED',
                confidenceScore: 95,
                classificationMethod: 'LLM',
                needsReview: false,
            },
        });
        expect(markProspectAsReplied).toHaveBeenCalledWith('cp-1');
        expect(handleClassificationActions).toHaveBeenCalledWith(
            { id: 'inbox-1' },
            'INTERESTED',
            'conv-1'
        );
    });

    it('triggers UNSUBSCRIBE action path from rules without LLM', async () => {
        vi.mocked(fetchNewMessages).mockResolvedValue([{ id: 'gmail-2', threadId: 'thread-2' }] as any);
        vi.mocked(fetchMessageDetails).mockResolvedValue({
            id: 'gmail-2',
            threadId: 'thread-2',
            internalDate: `${Date.now()}`,
            headers: {
                from: 'prospect@example.com',
                to: 'sender@leadgen.com',
                subject: 'Please unsubscribe me',
                date: 'Mon, 10 Feb 2026 10:00:00 +0000',
                messageId: '<msg-2>',
            },
            body: {
                raw: 'Please unsubscribe me immediately.',
                cleaned: 'Please unsubscribe me immediately.',
            },
            labelIds: [],
            snippet: '',
        } as any);
        vi.mocked(matchThreadToSentEmail).mockResolvedValue({
            id: 'sent-2',
            scheduledEmailId: 'sched-2',
            prospectId: 'prospect-2',
            campaignId: 'campaign-2',
        } as any);
        vi.mocked(createOrUpdateConversation).mockResolvedValue({ id: 'conv-2' } as any);
        vi.mocked(createInboxMessage).mockResolvedValue({
            id: 'inbox-2',
            conversationId: 'conv-2',
            direction: 'INBOUND',
            subject: 'Please unsubscribe me',
            bodyRaw: 'Please unsubscribe me immediately.',
            bodyCleaned: 'Please unsubscribe me immediately.',
        } as any);

        await syncWorkspaceInbox('ws-1');

        expect(llmProvider.classifyReply).not.toHaveBeenCalled();
        expect(markProspectAsReplied).not.toHaveBeenCalled();
        expect(handleClassificationActions).toHaveBeenCalledWith(
            { id: 'inbox-2' },
            'UNSUBSCRIBE',
            'conv-2'
        );
    });

    it('supports API needsReview filter and priority sort', async () => {
        vi.mocked(prisma.conversation.count).mockResolvedValue(2);
        vi.mocked(prisma.inboxMessage.count).mockResolvedValue(0);
        vi.mocked(prisma.conversation.findMany).mockResolvedValue([
            {
                id: 'conv-low',
                threadId: 'thread-low',
                workspaceId: 'ws-1',
                prospectId: 'p-low',
                campaignId: null,
                sequenceId: null,
                status: 'OPEN',
                lastMessageAt: new Date('2026-02-15T10:00:00Z'),
                createdAt: new Date('2026-02-15T10:00:00Z'),
                updatedAt: new Date('2026-02-15T10:00:00Z'),
                prospect: { id: 'p-low', email: 'low@example.com', firstName: null, lastName: null, company: null },
                campaign: null,
                messages: [{ classification: 'OTHER', receivedAt: new Date('2026-02-15T10:00:00Z') }],
                _count: { messages: 0 },
            },
            {
                id: 'conv-int',
                threadId: 'thread-int',
                workspaceId: 'ws-1',
                prospectId: 'p-int',
                campaignId: null,
                sequenceId: null,
                status: 'OPEN',
                lastMessageAt: new Date('2026-02-15T09:00:00Z'),
                createdAt: new Date('2026-02-15T09:00:00Z'),
                updatedAt: new Date('2026-02-15T09:00:00Z'),
                prospect: { id: 'p-int', email: 'int@example.com', firstName: null, lastName: null, company: null },
                campaign: null,
                messages: [{ classification: 'INTERESTED', receivedAt: new Date('2026-02-15T09:00:00Z') }],
                _count: { messages: 0 },
            },
        ] as any);

        const res = await getConversations(createRequest('/api/inbox/conversations?needsReview=true&sortByPriority=true'));
        const json = await res.json();

        expect(prisma.conversation.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    messages: expect.objectContaining({
                        some: expect.objectContaining({
                            needsReview: true,
                            direction: 'INBOUND',
                        }),
                    }),
                }),
            })
        );
        expect(json.data.conversations[0].id).toBe('conv-int');
    });
});
