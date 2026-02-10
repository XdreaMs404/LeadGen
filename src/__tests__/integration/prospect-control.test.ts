/**
 * Integration Tests: Prospect Control
 * Story 5.7: Individual Lead Control within Campaign
 * 
 * Tests prospect control operations with database.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma/client';
import {
    pauseProspect,
    resumeProspect,
    stopProspect,
    updateProspectStatus,
} from '@/lib/email-scheduler/prospect-control';
import {
    CampaignStatus,
    EnrollmentStatus,
    ScheduledEmailStatus,
} from '@prisma/client';

/**
 * Integration test suite for prospect control.
 * These tests require a test database with the proper setup.
 */
describe('prospect-control integration', () => {
    // Test data IDs (will be created in beforeEach)
    let testWorkspaceId: string;
    let testCampaignId: string;
    let testProspectId: string;
    let testEnrollmentId: string;

    /**
     * Note: These tests should be run against a test database.
     * In a CI environment, you may need to:
     * 1. Set up a test database
     * 2. Run migrations
     * 3. Seed test data
     * 
     * For now, we're marking tests as .skip to avoid database dependencies.
     * Remove .skip when running with a test database.
     */

    describe.skip('pauseProspect', () => {
        beforeEach(async () => {
            // Create test workspace, campaign, and prospect
            const workspace = await prisma.workspace.create({
                data: { name: 'Test Workspace' },
            });
            testWorkspaceId = workspace.id;

            const campaign = await prisma.campaign.create({
                data: {
                    name: 'Test Campaign',
                    status: CampaignStatus.RUNNING,
                    workspaceId: testWorkspaceId,
                },
            });
            testCampaignId = campaign.id;

            const prospect = await prisma.prospect.create({
                data: {
                    email: 'test@example.com',
                    workspaceId: testWorkspaceId,
                },
            });
            testProspectId = prospect.id;

            const enrollment = await prisma.campaignProspect.create({
                data: {
                    campaignId: testCampaignId,
                    prospectId: testProspectId,
                    enrollmentStatus: EnrollmentStatus.ENROLLED,
                },
            });
            testEnrollmentId = enrollment.id;
        });

        afterEach(async () => {
            // Cleanup test data
            await prisma.campaignProspect.deleteMany({
                where: { campaignId: testCampaignId },
            });
            await prisma.campaign.deleteMany({
                where: { workspaceId: testWorkspaceId },
            });
            await prisma.prospect.deleteMany({
                where: { workspaceId: testWorkspaceId },
            });
            await prisma.workspace.delete({
                where: { id: testWorkspaceId },
            });
        });

        it('should pause an enrolled prospect', async () => {
            const result = await pauseProspect(
                testCampaignId,
                testProspectId,
                testWorkspaceId
            );

            expect(result.enrollmentStatus).toBe(EnrollmentStatus.PAUSED);
            expect(result.pausedAt).toBeTruthy();
        });

        it('should throw error for invalid transition', async () => {
            // First pause the prospect
            await pauseProspect(testCampaignId, testProspectId, testWorkspaceId);

            // Try to pause again
            await expect(
                pauseProspect(testCampaignId, testProspectId, testWorkspaceId)
            ).rejects.toThrow('Impossible de mettre en pause');
        });
    });

    describe.skip('resumeProspect', () => {
        beforeEach(async () => {
            // Create test data with PAUSED prospect
            const workspace = await prisma.workspace.create({
                data: { name: 'Test Workspace' },
            });
            testWorkspaceId = workspace.id;

            const campaign = await prisma.campaign.create({
                data: {
                    name: 'Test Campaign',
                    status: CampaignStatus.RUNNING,
                    workspaceId: testWorkspaceId,
                },
            });
            testCampaignId = campaign.id;

            const prospect = await prisma.prospect.create({
                data: {
                    email: 'test@example.com',
                    workspaceId: testWorkspaceId,
                },
            });
            testProspectId = prospect.id;

            await prisma.campaignProspect.create({
                data: {
                    campaignId: testCampaignId,
                    prospectId: testProspectId,
                    enrollmentStatus: EnrollmentStatus.PAUSED,
                    pausedAt: new Date(),
                },
            });
        });

        afterEach(async () => {
            await prisma.campaignProspect.deleteMany({
                where: { campaignId: testCampaignId },
            });
            await prisma.campaign.deleteMany({
                where: { workspaceId: testWorkspaceId },
            });
            await prisma.prospect.deleteMany({
                where: { workspaceId: testWorkspaceId },
            });
            await prisma.workspace.delete({
                where: { id: testWorkspaceId },
            });
        });

        it('should resume a paused prospect', async () => {
            const result = await resumeProspect(
                testCampaignId,
                testProspectId,
                testWorkspaceId
            );

            expect(result.enrollmentStatus).toBe(EnrollmentStatus.ENROLLED);
            expect(result.pausedAt).toBeNull();
        });
    });

    describe.skip('stopProspect', () => {
        beforeEach(async () => {
            // Create test data with scheduled emails
            const workspace = await prisma.workspace.create({
                data: { name: 'Test Workspace' },
            });
            testWorkspaceId = workspace.id;

            const campaign = await prisma.campaign.create({
                data: {
                    name: 'Test Campaign',
                    status: CampaignStatus.RUNNING,
                    workspaceId: testWorkspaceId,
                },
            });
            testCampaignId = campaign.id;

            const prospect = await prisma.prospect.create({
                data: {
                    email: 'test@example.com',
                    workspaceId: testWorkspaceId,
                },
            });
            testProspectId = prospect.id;

            const enrollment = await prisma.campaignProspect.create({
                data: {
                    campaignId: testCampaignId,
                    prospectId: testProspectId,
                    enrollmentStatus: EnrollmentStatus.ENROLLED,
                },
            });
            testEnrollmentId = enrollment.id;

            // Create some scheduled emails
            await prisma.scheduledEmail.createMany({
                data: [
                    {
                        campaignProspectId: enrollment.id,
                        stepNumber: 1,
                        scheduledFor: new Date(Date.now() + 3600000),
                        status: ScheduledEmailStatus.SCHEDULED,
                        idempotencyKey: `test-key-1-${testProspectId}`,
                    },
                    {
                        campaignProspectId: enrollment.id,
                        stepNumber: 2,
                        scheduledFor: new Date(Date.now() + 7200000),
                        status: ScheduledEmailStatus.SCHEDULED,
                        idempotencyKey: `test-key-2-${testProspectId}`,
                    },
                ],
            });
        });

        afterEach(async () => {
            await prisma.scheduledEmail.deleteMany({
                where: { campaignProspect: { campaignId: testCampaignId } },
            });
            await prisma.campaignProspect.deleteMany({
                where: { campaignId: testCampaignId },
            });
            await prisma.campaign.deleteMany({
                where: { workspaceId: testWorkspaceId },
            });
            await prisma.prospect.deleteMany({
                where: { workspaceId: testWorkspaceId },
            });
            await prisma.workspace.delete({
                where: { id: testWorkspaceId },
            });
        });

        it('should stop prospect and cancel pending emails', async () => {
            const result = await stopProspect(
                testCampaignId,
                testProspectId,
                testWorkspaceId
            );

            expect(result.prospect.enrollmentStatus).toBe(EnrollmentStatus.STOPPED);
            expect(result.emailsCancelled).toBe(2);

            // Verify emails are cancelled
            const emails = await prisma.scheduledEmail.findMany({
                where: { campaignProspectId: testEnrollmentId },
            });

            emails.forEach((email) => {
                expect(email.status).toBe(ScheduledEmailStatus.CANCELLED);
                expect(email.idempotencyKey).toContain('::CANCELLED::');
            });
        });
    });

    describe.skip('updateProspectStatus', () => {
        beforeEach(async () => {
            const workspace = await prisma.workspace.create({
                data: { name: 'Test Workspace' },
            });
            testWorkspaceId = workspace.id;

            const campaign = await prisma.campaign.create({
                data: {
                    name: 'Test Campaign',
                    status: CampaignStatus.RUNNING,
                    workspaceId: testWorkspaceId,
                },
            });
            testCampaignId = campaign.id;

            const prospect = await prisma.prospect.create({
                data: {
                    email: 'test@example.com',
                    workspaceId: testWorkspaceId,
                },
            });
            testProspectId = prospect.id;

            await prisma.campaignProspect.create({
                data: {
                    campaignId: testCampaignId,
                    prospectId: testProspectId,
                    enrollmentStatus: EnrollmentStatus.ENROLLED,
                },
            });
        });

        afterEach(async () => {
            await prisma.campaignProspect.deleteMany({
                where: { campaignId: testCampaignId },
            });
            await prisma.campaign.deleteMany({
                where: { workspaceId: testWorkspaceId },
            });
            await prisma.prospect.deleteMany({
                where: { workspaceId: testWorkspaceId },
            });
            await prisma.workspace.delete({
                where: { id: testWorkspaceId },
            });
        });

        it('should route pause action correctly', async () => {
            const result = await updateProspectStatus(
                testCampaignId,
                testProspectId,
                testWorkspaceId,
                'pause'
            );

            expect(result.prospect.enrollmentStatus).toBe(EnrollmentStatus.PAUSED);
        });

        it('should throw for non-existent campaign', async () => {
            await expect(
                updateProspectStatus(
                    'non-existent-id',
                    testProspectId,
                    testWorkspaceId,
                    'pause'
                )
            ).rejects.toThrow('Campagne non trouvée');
        });

        it('should throw for non-existent enrollment', async () => {
            await expect(
                updateProspectStatus(
                    testCampaignId,
                    'non-existent-prospect',
                    testWorkspaceId,
                    'pause'
                )
            ).rejects.toThrow('non inscrit');
        });
    });
});
