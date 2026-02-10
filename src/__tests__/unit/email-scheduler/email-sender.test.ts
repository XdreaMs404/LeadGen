
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processScheduledEmail } from '@/lib/email-scheduler/email-sender';
import { prisma } from '@/lib/prisma/client';
import { sendEmail } from '@/lib/gmail/sender';

// Mocks
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        $transaction: vi.fn((callback) => callback(prisma)),
        sentEmail: { create: vi.fn() },
        conversation: { upsert: vi.fn() },
        inboxMessage: { upsert: vi.fn() },
        sendingSettings: { findUnique: vi.fn() },
        openerCache: { findUnique: vi.fn() },
        campaignProspect: { update: vi.fn() },
        scheduledEmail: { update: vi.fn() },
        campaign: { findUnique: vi.fn() }, // implicitly used via relation usually, but good to mock
    },
}));

vi.mock('@/lib/gmail/sender', () => ({
    sendEmail: vi.fn(),
    base64urlEncode: vi.fn((str) => str),
    GmailSendError: class {
        message: string;
        isRetryable: boolean;
        constructor(msg: string, isRetryable: boolean) {
            this.message = msg;
            this.isRetryable = isRetryable;
        }
    },
}));

vi.mock('@/lib/gmail/token-service', () => ({
    getValidToken: vi.fn().mockResolvedValue({ accessToken: 'mock-token', email: 'test@example.com' }),
}));

vi.mock('@/lib/guardrails/quota', () => ({
    getRemainingQuota: vi.fn().mockResolvedValue(100),
}));

vi.mock('@/lib/email-scheduler/retry-handler', () => ({
    markAsSending: vi.fn().mockResolvedValue(true),
    markAsSent: vi.fn(),
    handleEmailFailure: vi.fn(),
    markEmailAsCancelled: vi.fn(),
}));

vi.mock('@/lib/gmail/threading', () => ({
    getThreadContext: vi.fn().mockResolvedValue(null),
}));

describe('Email Sender', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should execute DB operations in a transaction after sending', async () => {
        // Setup mock data
        const mockScheduledEmail: any = {
            id: 'email-1',
            workspaceId: 'ws-1',
            campaignId: 'camp-1',
            prospectId: 'pros-1',
            stepNumber: 1,
            campaign: { status: 'RUNNING', workspaceId: 'ws-1', sequence: { id: 'seq-1', steps: [] } },
            campaignProspect: { enrollmentStatus: 'ENROLLED' },
            prospect: { email: 'pros@example.com' },
            sequence: { id: 'seq-1', steps: [{ id: 'step-1', order: 1, subject: 'Hi', body: 'Hello' }] },
        };

        // Mock sendEmail success
        vi.mocked(sendEmail).mockResolvedValue({
            messageId: 'msg-id-123',
            threadId: 'thread-id-123',
            labelIds: ['SENT'],
        });

        // Mock transaction return (just passes through for test, but we check if called)
        const mockConversation = { id: 'conv-1' };
        vi.mocked(prisma.conversation.upsert).mockResolvedValue(mockConversation as any);

        // Execute
        await processScheduledEmail(mockScheduledEmail);

        // Verify transaction was used
        expect(prisma.$transaction).toHaveBeenCalled();

        // Verify operations inside transaction (since our mock executes the callback immediately)
        expect(prisma.sentEmail.create).toHaveBeenCalled();
        expect(prisma.conversation.upsert).toHaveBeenCalledWith(expect.objectContaining({
            where: { workspaceId_threadId: { workspaceId: 'ws-1', threadId: 'thread-id-123' } },
        }));
        expect(prisma.inboxMessage.upsert).toHaveBeenCalledWith(expect.objectContaining({
            create: expect.objectContaining({
                conversationId: 'conv-1',
                direction: 'OUTBOUND',
                bodyCleaned: expect.stringContaining('Hello'), // Verify bodyCleaned is set
            })
        }));
    });
});
