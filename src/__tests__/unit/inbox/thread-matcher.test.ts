/**
 * Unit Tests for Thread Matcher (Story 6.1)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Prisma client
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        sentEmail: {
            findFirst: vi.fn(),
        },
        conversation: {
            upsert: vi.fn(),
        },
        campaignProspect: {
            update: vi.fn(),
            findUnique: vi.fn(),
        },
        scheduledEmail: {
            updateMany: vi.fn(),
        },
        inboxMessage: {
            upsert: vi.fn(),
        },
        prospect: {
            findUnique: vi.fn(),
        },
    },
}));

import { prisma } from '@/lib/prisma/client';
import {
    matchThreadToSentEmail,
    createOrUpdateConversation,
    markProspectAsReplied,
    findCampaignProspect,
    createInboxMessage,
    findProspectByEmail,
} from '@/lib/inbox/thread-matcher';

describe('thread-matcher', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('matchThreadToSentEmail', () => {
        it('should return sent email when thread matches', async () => {
            const mockSentEmail = {
                id: 'sent-email-1',
                threadId: 'thread-123',
                workspaceId: 'workspace-1',
                prospectId: 'prospect-1',
                campaignId: 'campaign-1',
            };

            vi.mocked(prisma.sentEmail.findFirst).mockResolvedValue(mockSentEmail as never);

            const result = await matchThreadToSentEmail('thread-123', 'workspace-1');

            expect(prisma.sentEmail.findFirst).toHaveBeenCalledWith({
                where: {
                    threadId: 'thread-123',
                    workspaceId: 'workspace-1',
                },
                orderBy: {
                    sentAt: 'desc',
                },
            });
            expect(result).toEqual(mockSentEmail);
        });

        it('should return null when no match found', async () => {
            vi.mocked(prisma.sentEmail.findFirst).mockResolvedValue(null);

            const result = await matchThreadToSentEmail('unknown-thread', 'workspace-1');

            expect(result).toBeNull();
        });
    });

    describe('createOrUpdateConversation', () => {
        it('should upsert conversation with provided data', async () => {
            const mockConversation = {
                id: 'conv-1',
                threadId: 'thread-123',
                workspaceId: 'workspace-1',
                prospectId: 'prospect-1',
                campaignId: 'campaign-1',
                status: 'OPEN',
                lastMessageAt: new Date(),
            };

            vi.mocked(prisma.conversation.upsert).mockResolvedValue(mockConversation as never);

            const result = await createOrUpdateConversation({
                threadId: 'thread-123',
                workspaceId: 'workspace-1',
                prospectId: 'prospect-1',
                campaignId: 'campaign-1',
                sequenceId: 'seq-1',
                lastMessageAt: new Date(),
            });

            expect(prisma.conversation.upsert).toHaveBeenCalled();
            expect(result).toEqual(mockConversation);
        });
    });

    describe('markProspectAsReplied', () => {
        it('should update enrollment status and cancel scheduled emails', async () => {
            vi.mocked(prisma.campaignProspect.update).mockResolvedValue({} as never);
            vi.mocked(prisma.scheduledEmail.updateMany).mockResolvedValue({ count: 2 } as never);

            await markProspectAsReplied('cp-1');

            expect(prisma.campaignProspect.update).toHaveBeenCalledWith({
                where: { id: 'cp-1' },
                data: { enrollmentStatus: 'REPLIED' },
            });

            expect(prisma.scheduledEmail.updateMany).toHaveBeenCalledWith({
                where: {
                    campaignProspectId: 'cp-1',
                    status: {
                        in: ['SCHEDULED', 'RETRY_SCHEDULED'],
                    },
                },
                data: {
                    status: 'CANCELLED',
                },
            });
        });
    });

    describe('findCampaignProspect', () => {
        it('should find campaign prospect by composite key', async () => {
            const mockCP = {
                id: 'cp-1',
                campaignId: 'campaign-1',
                prospectId: 'prospect-1',
                enrollmentStatus: 'ENROLLED',
            };

            vi.mocked(prisma.campaignProspect.findUnique).mockResolvedValue(mockCP as never);

            const result = await findCampaignProspect('prospect-1', 'campaign-1');

            expect(prisma.campaignProspect.findUnique).toHaveBeenCalledWith({
                where: {
                    campaignId_prospectId: {
                        campaignId: 'campaign-1',
                        prospectId: 'prospect-1',
                    },
                },
            });
            expect(result).toEqual(mockCP);
        });
    });

    describe('createInboxMessage', () => {
        it('should upsert inbox message', async () => {
            const mockMessage = {
                id: 'msg-1',
                conversationId: 'conv-1',
                gmailMessageId: 'gmail-123',
            };

            vi.mocked(prisma.inboxMessage.upsert).mockResolvedValue(mockMessage as never);

            await createInboxMessage({
                conversationId: 'conv-1',
                gmailMessageId: 'gmail-123',
                direction: 'INBOUND',
                subject: 'Re: Hello',
                bodyRaw: 'Thanks!',
                bodyCleaned: 'Thanks!',
                fromEmail: 'prospect@example.com',
                toEmail: 'user@example.com',
                receivedAt: new Date(),
            });

            expect(prisma.inboxMessage.upsert).toHaveBeenCalled();
        });
    });

    describe('findProspectByEmail', () => {
        it('should find prospect by email in workspace', async () => {
            const mockProspect = { id: 'prospect-1' };

            vi.mocked(prisma.prospect.findUnique).mockResolvedValue(mockProspect as never);

            const result = await findProspectByEmail('test@example.com', 'workspace-1');

            expect(prisma.prospect.findUnique).toHaveBeenCalledWith({
                where: {
                    workspaceId_email: {
                        workspaceId: 'workspace-1',
                        email: 'test@example.com',
                    },
                },
                select: { id: true },
            });
            expect(result).toEqual(mockProspect);
        });

        it('should return null when prospect not found', async () => {
            vi.mocked(prisma.prospect.findUnique).mockResolvedValue(null);

            const result = await findProspectByEmail('unknown@example.com', 'workspace-1');

            expect(result).toBeNull();
        });
    });
});
