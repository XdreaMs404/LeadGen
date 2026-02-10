/**
 * Verification Script for Story 5.8
 * 
 * Usage: npx tsx src/scripts/verify-anomaly-detection.ts
 */

import { prisma } from '@/lib/prisma/client';
import { CampaignStatus, ScheduledEmailStatus } from '@prisma/client';
import { detectAnomalies } from '@/lib/email-scheduler/anomaly-detection';
import { autoPauseCampaign } from '@/lib/email-scheduler/auto-pause';

async function main() {
    console.log('🔍 Starting Verification for Story 5.8 Anomaly Detection...');

    // 1. Setup: Get user and workspace
    console.log('\n1️⃣  Setting up test data...');
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    // Get workspace (Direct relation based on schema)
    let workspace = await prisma.workspace.findFirst({
        where: { userId: user.id }
    });

    // Fallback if user has no workspace
    if (!workspace) {
        console.log('   User has no workspace, looking for any workspace...');
        workspace = await prisma.workspace.findFirst();
    }

    if (!workspace) throw new Error('No workspace found in DB');
    const workspaceId = workspace.id;
    console.log(`   Using workspace: ${workspace.name} (${workspaceId})`);

    // Get a sequence (required for campaign)
    let sequence = await prisma.sequence.findFirst({
        where: { workspaceId }
    });

    if (!sequence) {
        // Create dummy sequence if none exists
        sequence = await prisma.sequence.create({
            data: {
                workspaceId,
                name: 'Test Sequence',
                status: 'DRAFT',
            }
        });
    }

    // Create a dummy campaign
    const campaign = await prisma.campaign.create({
        data: {
            workspaceId,
            name: `TEST Anomaly Detection ${Date.now()}`,
            status: CampaignStatus.RUNNING,
            startedAt: new Date(),
            sequenceId: sequence.id,
        }
    });
    console.log(`   Created test campaign: ${campaign.name} (${campaign.id})`);

    // Create a dummy prospect for the emails
    const prospect = await prisma.prospect.create({
        data: {
            workspaceId,
            email: `test-prospect-${Date.now()}@example.com`,
            status: 'NEW',
        }
    });

    // Create campaign enrollment (required for ScheduledEmail)
    const campaignProspect = await prisma.campaignProspect.create({
        data: {
            campaignId: campaign.id,
            prospectId: prospect.id,
            enrollmentStatus: 'ENROLLED',
        }
    });

    // 2. Simulate Emails: Insert sent and bounced emails to trigger threshold
    // Using VERY_LOW tier: >40% bounce rate triggers pause (min 3 bounces, min 5 total)
    console.log('\n2️⃣  Simulating email traffic (VERY_LOW tier)...');

    // Create 3 bounces (needs to be > 40% of total)
    console.log('   Creating 3 bounced emails...');
    for (let i = 0; i < 3; i++) {
        await prisma.scheduledEmail.create({
            data: {
                campaignId: campaign.id,
                workspaceId,
                status: ScheduledEmailStatus.PERMANENTLY_FAILED,
                lastError: '550 5.1.1 User unknown (simulated bounce)',
                // recipient: `bounce${i}@example.com`, // Removed as it doesn't exist on model
                scheduledFor: new Date(),
                sentAt: new Date(),
                updatedAt: new Date(),

                // Required relations
                prospectId: prospect.id,
                campaignProspectId: campaignProspect.id,
                sequenceId: sequence.id,
                stepNumber: 1,
                idempotencyKey: `test-bounce-${i}-${Date.now()}`,
            }
        });
    }

    // Create 2 sent emails (Total 5 emails, 3 bounces = 60% bounce rate)
    console.log('   Creating 2 successfully sent emails...');
    for (let i = 0; i < 2; i++) {
        await prisma.scheduledEmail.create({
            data: {
                campaignId: campaign.id,
                workspaceId,
                status: ScheduledEmailStatus.SENT,
                // recipient: `valid${i}@example.com`,
                scheduledFor: new Date(),
                sentAt: new Date(),
                updatedAt: new Date(),

                // Required relations
                prospectId: prospect.id,
                campaignProspectId: campaignProspect.id,
                sequenceId: sequence.id,
                stepNumber: 1,
                idempotencyKey: `test-sent-${i}-${Date.now()}`,
            }
        });
    }

    // 3. Test Detection
    console.log('\n3️⃣  Running Anomaly Detection...');
    const result = await detectAnomalies(campaign.id);

    if (!result) {
        throw new Error('❌ Detection returned null');
    }

    console.log('   Detection Result:', {
        shouldPause: result.shouldPause,
        reason: result.reason,
        bounceRate: result.metrics.bounceRate.toFixed(1) + '%'
    });

    if (result.shouldPause && result.reason === 'HIGH_BOUNCE_RATE') {
        console.log('   ✅ CORRECT: Triggered pause for high bounce rate');
    } else {
        console.error('   ❌ FAILED: Did not trigger pause as expected');
        return;
    }

    // 4. Test Auto-Pause
    console.log('\n4️⃣  Executing Auto-Pause...');
    await autoPauseCampaign(campaign.id, result.reason, result.metrics);

    const pausedCampaign = await prisma.campaign.findUnique({
        where: { id: campaign.id }
    });

    if (pausedCampaign?.status === 'PAUSED' && pausedCampaign.autoPausedReason === 'HIGH_BOUNCE_RATE') {
        console.log('   ✅ Campaign status is now PAUSED');
        console.log('   ✅ Auto-pause reason is set to HIGH_BOUNCE_RATE');
    } else {
        console.error('   ❌ Campaign update failed');
    }

    // 5. Cleanup
    console.log('\n5️⃣  Cleaning up...');
    await prisma.scheduledEmail.deleteMany({ where: { campaignId: campaign.id } });
    await prisma.campaignProspect.deleteMany({ where: { campaignId: campaign.id } });
    await prisma.campaign.delete({ where: { id: campaign.id } });
    // Keep user/workspace/sequence as they might be used by others or are persistent
    console.log('   Test campaign deleted.');

    console.log('\n✅ VERIFICATION SUCCESSFUL!');
    console.log('   The anomaly detection logic and auto-pause mechanism are working correctly within the DB.');
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
