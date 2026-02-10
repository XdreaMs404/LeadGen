
import { prisma } from '@/lib/prisma/client';
import { runAnomalyDetectionAndPause, resumeAutoPausedCampaign } from '@/lib/email-scheduler/auto-pause';
import { CampaignStatus, ScheduledEmailStatus } from '@prisma/client';
import { describe, beforeAll, afterAll, beforeEach, it, expect } from 'vitest';

describe('Anomaly Detection Integration', () => {
    let workspaceId: string;
    let campaignId: string;
    let userId: string;

    beforeAll(async () => {
        // Setup user
        const user = await prisma.user.create({
            data: {
                id: `user_${Date.now()}_${Math.random()}`,
                email: `test_${Date.now()}_${Math.random()}@example.com`,
            }
        });
        userId = user.id;

        // Create workspace
        const workspace = await prisma.workspace.create({
            data: {
                name: 'Test Workspace',
                userId: userId,
            }
        });
        workspaceId = workspace.id;
    });

    afterAll(async () => {
        if (workspaceId) await prisma.workspace.delete({ where: { id: workspaceId } });
        if (userId) await prisma.user.delete({ where: { id: userId } });
    });

    beforeEach(async () => {
        if (!workspaceId) {
            console.error('BeforeEach: workspaceId is undefined!');
            return;
        }
        // Clean up campaigns
        await prisma.campaign.deleteMany({ where: { workspaceId } });
        await prisma.notification.deleteMany({ where: { workspaceId } });
    });

    it('should auto-pause campaign with high bounce rate', async () => {
        // Create campaign
        const campaign = await prisma.campaign.create({
            data: {
                workspaceId,
                name: 'Bouncy Campaign',
                status: CampaignStatus.RUNNING,
            }
        });
        campaignId = campaign.id;

        // Create prospect
        const prospect = await prisma.prospect.create({
            data: {
                workspaceId,
                email: `prospect_${Date.now()}@example.com`,
            }
        });

        // Create sequence
        const sequence = await prisma.sequence.create({
            data: { workspaceId, name: 'Seq' }
        });

        // Create campaign prospect
        const campaignProspect = await prisma.campaignProspect.create({
            data: {
                campaignId,
                prospectId: prospect.id,
            }
        });

        // Seed data: 100 emails, 15 bounces (15% rate, HIGH for MEDIUM volume)
        const emails = [];
        for (let i = 0; i < 100; i++) {
            const isBounce = i < 15;
            emails.push({
                workspaceId,
                campaignId,
                campaignProspectId: campaignProspect.id,
                prospectId: prospect.id,
                sequenceId: sequence.id,
                stepNumber: 1,
                idempotencyKey: `key_${i}_${Date.now()}`,
                status: isBounce ? ScheduledEmailStatus.PERMANENTLY_FAILED : ScheduledEmailStatus.SENT,
                lastError: isBounce ? '550 User not found' : null,
                scheduledFor: new Date(),
                updatedAt: new Date(),
            });
        }

        await prisma.scheduledEmail.createMany({ data: emails });

        // Run Detection
        const paused = await runAnomalyDetectionAndPause(workspaceId);

        expect(paused).toHaveLength(1);
        expect(paused[0].campaignId).toBe(campaignId);
        expect(paused[0].reason).toBe('HIGH_BOUNCE_RATE');

        // Verify DB state
        const updatedCampaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
        expect(updatedCampaign?.status).toBe(CampaignStatus.PAUSED);
        expect(updatedCampaign?.autoPausedReason).toBe('HIGH_BOUNCE_RATE');

        // Verify Notification created
        const notification = await prisma.notification.findFirst({
            where: { workspaceId, type: 'ANOMALY_PAUSE' }
        });
        expect(notification).not.toBeNull();
        // Since metadata is Json, checking partial match might be tricky with simple expect in Vitest unless customized
        // But we can check message
        if (notification) {
            expect(notification.title).toContain('Taux de rebond');
        }
    });

    it('should require acknowledgment to resume', async () => {
        // Manually pause campaign with reason
        const campaign = await prisma.campaign.create({
            data: {
                workspaceId,
                name: 'Paused Campaign',
                status: CampaignStatus.PAUSED,
                autoPausedReason: 'HIGH_BOUNCE_RATE',
                pausedAt: new Date(),
            }
        });

        // Try to resume without Ack - should fail
        await expect(
            resumeAutoPausedCampaign(campaign.id, workspaceId, false)
        ).rejects.toThrow('accepter le risque');

        // Resume with Ack - should succeed
        const resumed = await resumeAutoPausedCampaign(campaign.id, workspaceId, true);
        expect(resumed.status).toBe(CampaignStatus.RUNNING);
        expect(resumed.autoPausedReason).toBeNull();
    });
});
