import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleClassificationActions } from '@/lib/inbox/classification/auto-actions';
import { prisma } from '@/lib/prisma/client';

vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        conversation: {
            findUnique: vi.fn(),
        },
        prospect: {
            updateMany: vi.fn(),
        },
        campaignProspect: {
            updateMany: vi.fn(),
        },
        scheduledEmail: {
            updateMany: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
        },
    },
}));

const baseConversation = {
    id: 'conv-1',
    workspaceId: 'ws-1',
    prospectId: 'prospect-1',
    campaignId: 'campaign-1',
    workspace: {
        userId: 'user-1',
    },
};

describe('auto-actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(prisma.conversation.findUnique).mockResolvedValue(baseConversation as any);
    });

    it('handles UNSUBSCRIBE cascade actions', async () => {
        await handleClassificationActions({ id: 'msg-1' }, 'UNSUBSCRIBE', 'conv-1');

        expect(prisma.prospect.updateMany).toHaveBeenCalledWith({
            where: {
                id: 'prospect-1',
                status: { not: 'UNSUBSCRIBED' },
            },
            data: { status: 'UNSUBSCRIBED' },
        });
        expect(prisma.campaignProspect.updateMany).toHaveBeenCalledWith({
            where: {
                prospectId: 'prospect-1',
                enrollmentStatus: { not: 'STOPPED' },
            },
            data: { enrollmentStatus: 'STOPPED' },
        });
        expect(prisma.scheduledEmail.updateMany).toHaveBeenCalledWith({
            where: {
                prospectId: 'prospect-1',
                status: { in: ['SCHEDULED', 'RETRY_SCHEDULED'] },
            },
            data: { status: 'CANCELLED' },
        });
        expect(prisma.auditLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    action: 'PROSPECT_UNSUBSCRIBED',
                    entityType: 'PROSPECT',
                }),
            })
        );
    });

    it('handles BOUNCE cascade actions', async () => {
        await handleClassificationActions({ id: 'msg-2' }, 'BOUNCE', 'conv-1');

        expect(prisma.prospect.updateMany).toHaveBeenCalledWith({
            where: {
                id: 'prospect-1',
                status: { not: 'BOUNCED' },
            },
            data: { status: 'BOUNCED' },
        });
        expect(prisma.campaignProspect.updateMany).toHaveBeenCalledWith({
            where: {
                prospectId: 'prospect-1',
                enrollmentStatus: { not: 'STOPPED' },
            },
            data: { enrollmentStatus: 'STOPPED' },
        });
        expect(prisma.auditLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    action: 'PROSPECT_BOUNCED',
                    entityType: 'PROSPECT',
                }),
            })
        );
    });

    it('marks enrollments as REPLIED for INTERESTED', async () => {
        await handleClassificationActions({ id: 'msg-3' }, 'INTERESTED', 'conv-1');

        expect(prisma.campaignProspect.updateMany).toHaveBeenCalledWith({
            where: {
                prospectId: 'prospect-1',
                campaignId: 'campaign-1',
                enrollmentStatus: {
                    in: ['ENROLLED', 'PAUSED'],
                },
            },
            data: {
                enrollmentStatus: 'REPLIED',
            },
        });
    });
});
