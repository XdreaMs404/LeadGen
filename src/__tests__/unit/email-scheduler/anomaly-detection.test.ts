import { detectAnomalies, getVolumeTier } from '@/lib/email-scheduler/anomaly-detection';
import { prisma } from '@/lib/prisma/client';
import { CampaignStatus, ScheduledEmailStatus } from '@prisma/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        campaign: {
            findUnique: vi.fn(),
        },
        scheduledEmail: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
        campaignProspect: {
            count: vi.fn(),
        },
    },
}));

describe('Anomaly Detection Unit Tests', () => {
    const mockCampaignId = 'cam_123';
    const mockCampaign = {
        id: mockCampaignId,
        name: 'Test Campaign',
        status: CampaignStatus.RUNNING,
        workspaceId: 'ws_123',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (prisma.campaign.findUnique as any).mockResolvedValue(mockCampaign);
    });

    describe('Volume Tiers', () => {
        it('should return null for very low volume (<5)', () => {
            expect(getVolumeTier(4)).toBeNull();
        });

        it('should return VERY_LOW for 5-19 emails', () => {
            expect(getVolumeTier(10)).toBe('VERY_LOW');
        });

        it('should return MEDIUM for 100-499 emails', () => {
            expect(getVolumeTier(150)).toBe('MEDIUM');
        });

        it('should return HIGH for 500+ emails', () => {
            expect(getVolumeTier(600)).toBe('HIGH');
        });
    });

    describe('detectAnomalies', () => {
        it('should return null if campaign is not running', async () => {
            (prisma.campaign.findUnique as any).mockResolvedValue({ ...mockCampaign, status: 'PAUSED' });
            const result = await detectAnomalies(mockCampaignId);
            expect(result).toBeNull();
        });

        it('should pause on high bounce rate (MEDIUM tier)', async () => {
            // 200 emails, 30 bounces (15% rate) -> Threshold is 10% for MEDIUM
            const total = 200;
            const bounces = 30;

            // Mock calculateBounceRate data
            // We mock scheduledEmail.findMany to return enough "sent" and "bounced" emails
            // But calculateBounceRate implementation calls findMany.
            // Instead of mocking the internal calls of calculateBounceRate perfectly, 
            // we can mock the module functions if we exported them, but they are in the same file.
            // So we must mock Prisma responses correctly.

            // Mock for calculateBounceRate
            (prisma.scheduledEmail.findMany as any).mockResolvedValue(
                [
                    ...Array(bounces).fill({ status: ScheduledEmailStatus.PERMANENTLY_FAILED, lastError: '550 User not found' }),
                    ...Array(total - bounces).fill({ status: ScheduledEmailStatus.SENT }),
                ]
            );

            // Mock for calculateUnsubscribeRate (return 0)
            (prisma.scheduledEmail.count as any).mockResolvedValue(total);
            (prisma.campaignProspect.count as any).mockResolvedValue(0);

            const result = await detectAnomalies(mockCampaignId);

            expect(result).not.toBeNull();
            expect(result?.shouldPause).toBe(true);
            expect(result?.reason).toBe('HIGH_BOUNCE_RATE');
            expect(result?.metrics.volumeTier).toBe('MEDIUM');
            expect(result?.metrics.bounceRate).toBe(15);
        });

        it('should warn on elevated bounce rate (below pause threshold)', async () => {
            // MEDIUM tier: Warn at 3%, Pause at 5%
            // 200 emails, 8 bounces (4% rate) - should WARN only
            const total = 200;
            const bounces = 8;

            (prisma.scheduledEmail.findMany as any).mockResolvedValue(
                [
                    ...Array(bounces).fill({ status: ScheduledEmailStatus.PERMANENTLY_FAILED, lastError: '550 User not found' }),
                    ...Array(total - bounces).fill({ status: ScheduledEmailStatus.SENT }),
                ]
            );

            (prisma.scheduledEmail.count as any).mockResolvedValue(total);
            (prisma.campaignProspect.count as any).mockResolvedValue(0);

            const result = await detectAnomalies(mockCampaignId);

            expect(result?.shouldPause).toBe(false);
            expect(result?.shouldWarn).toBe(true);
            expect(result?.severity).toBe('WARNING');
        });

        it('should not flag safe campaigns', async () => {
            const total = 200;
            const bounces = 2; // 1%

            (prisma.scheduledEmail.findMany as any).mockResolvedValue(
                [
                    ...Array(bounces).fill({ status: ScheduledEmailStatus.PERMANENTLY_FAILED, lastError: '550 User not found' }),
                    ...Array(total - bounces).fill({ status: ScheduledEmailStatus.SENT }),
                ]
            );

            (prisma.scheduledEmail.count as any).mockResolvedValue(total);
            (prisma.campaignProspect.count as any).mockResolvedValue(0);

            const result = await detectAnomalies(mockCampaignId);

            expect(result?.shouldPause).toBe(false);
            expect(result?.shouldWarn).toBe(false);
        });
    });
});
