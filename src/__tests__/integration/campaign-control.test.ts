
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignStatus, ScheduledEmailStatus } from '@prisma/client';

// Mock dependencies BEFORE imports
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        campaign: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        scheduledEmail: {
            findMany: vi.fn(),
            update: vi.fn(),
            deleteMany: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback({
            campaign: {
                update: vi.fn(),
            },
            scheduledEmail: {
                findMany: vi.fn(),
                update: vi.fn(),
                deleteMany: vi.fn(),
            },
        })),
    },
}));

import { stopCampaign } from '@/lib/email-scheduler/campaign-control';
import { prisma } from '@/lib/prisma/client';

describe('Campaign Control Integration (Mocked)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('stopCampaign', () => {
        it('should stop campaign and rename idempotency keys', async () => {
            const campaignId = 'camp-123';
            const workspaceId = 'ws-123';

            // Mock findFirst campaign
            vi.mocked(prisma.campaign.findFirst).mockResolvedValue({
                id: campaignId,
                workspaceId,
                status: CampaignStatus.RUNNING,
                sequenceId: 'seq-1',
            } as any);

            // Mock transaction mock
            const txMock = {
                campaign: {
                    update: vi.fn().mockResolvedValue({
                        id: campaignId,
                        workspaceId,
                        name: 'Test Campaign',
                        sequenceId: 'seq-1',
                        status: CampaignStatus.STOPPED,
                        sequence: { id: 'seq-1', name: 'Seq' },
                        prospects: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }),
                },
                scheduledEmail: {
                    findMany: vi.fn().mockResolvedValue([
                        { id: 'email-1', idempotencyKey: 'key-1' },
                        { id: 'email-2', idempotencyKey: 'key-2' },
                    ]),
                    update: vi.fn(),
                },
            };

            // Setup $transaction to use our txMock
            vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
                return await cb(txMock as any);
            });

            // ACTION
            const result = await stopCampaign(campaignId, workspaceId);

            // ASSERTIONS

            // 1. Check campaign status update
            expect(txMock.campaign.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: campaignId },
                data: expect.objectContaining({
                    status: CampaignStatus.STOPPED,
                }),
            }));

            // 2. Check emails were found
            expect(txMock.scheduledEmail.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    campaignId
                }),
            }));

            // 3. Check individual updates with renamed keys
            expect(txMock.scheduledEmail.update).toHaveBeenCalledTimes(2);

            // Verify email-1 update
            expect(txMock.scheduledEmail.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'email-1' },
                data: expect.objectContaining({
                    status: ScheduledEmailStatus.CANCELLED,
                    idempotencyKey: `key-1::CANCELLED::${campaignId}`,
                }),
            }));

            // Verify email-2 update
            expect(txMock.scheduledEmail.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'email-2' },
                data: expect.objectContaining({
                    status: ScheduledEmailStatus.CANCELLED,
                    idempotencyKey: `key-2::CANCELLED::${campaignId}`,
                }),
            }));

            // 4. Verify return result
            expect(result.emailsCancelled).toBe(2);
        });
    });
});
