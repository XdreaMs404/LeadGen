/**
 * Email Sending Worker
 * Story 5.5: Gmail API Email Sending with Threading
 * 
 * Main worker for processing and sending scheduled emails
 */

import { prisma } from '@/lib/prisma/client';
import { CampaignStatus, EnrollmentStatus, ScheduledEmailStatus } from '@prisma/client';
import { getValidToken } from '@/lib/gmail/token-service';
import { sendEmail, GmailSendError } from '@/lib/gmail/sender';
import {
    composeEmail,
    renderEmailBody,
    getThreadedSubject,
    generateUnsubscribeLink,
    buildHeadersJson,
} from '@/lib/gmail/compose-email';
import { getThreadContext } from '@/lib/gmail/threading';
import {
    markAsSending,
    markAsSent,
    handleEmailFailure,
    markEmailAsCancelled,
} from '@/lib/email-scheduler/retry-handler';
import { getRemainingQuota } from '@/lib/guardrails/quota';
import { createOrUpdateConversation, createInboxMessage } from '@/lib/inbox/thread-matcher';
import type { EmailProcessResult, EmailSendingStats } from '@/types/sent-email';

/**
 * Type for scheduled email with all required relations
 */
type ScheduledEmailWithRelations = Awaited<
    ReturnType<typeof import('./schedule-emails').getPendingEmails>
>[number];

/**
 * Delay between email sends (ms) - prevents Gmail burst detection
 */
const INTER_EMAIL_DELAY_MS = 3000; // 3 seconds between emails

/**
 * Maximum emails to process in a single cron run
 */
const MAX_EMAILS_PER_RUN = 10;

/**
 * Process a single scheduled email
 * 
 * @param scheduledEmail - The scheduled email with all relations
 * @returns Result of the processing operation
 */
export async function processScheduledEmail(
    scheduledEmail: ScheduledEmailWithRelations
): Promise<EmailProcessResult> {
    const { id, workspaceId, campaignId, prospectId, stepNumber, campaign, campaignProspect, prospect, sequence } = scheduledEmail;

    // 1. Pre-send checks: Campaign status (Story 5.6 AC5)
    // PAUSED: Skip email without cancelling (will be processed later when resumed)
    // STOPPED: Cancel email permanently
    if (campaign.status === CampaignStatus.PAUSED) {
        console.log(`[EmailSender] Skipping email ${id} - campaign is paused`);
        return { status: 'SKIPPED', error: 'Campaign paused' };
    }
    if (campaign.status === CampaignStatus.STOPPED) {
        await markEmailAsCancelled(id, 'Campaign stopped');
        return { status: 'CANCELLED', error: 'Campaign stopped' };
    }
    if (campaign.status !== CampaignStatus.RUNNING) {
        await markEmailAsCancelled(id, `Campaign not running (status: ${campaign.status})`);
        return { status: 'CANCELLED', error: 'Campaign not running' };
    }

    // 2. Pre-send checks: Enrollment status
    if (campaignProspect.enrollmentStatus === EnrollmentStatus.PAUSED) {
        console.log(`[EmailSender] Skipping email ${id} - prospect paused`);
        return { status: 'SKIPPED', error: 'Prospect paused' };
    }

    if (campaignProspect.enrollmentStatus !== EnrollmentStatus.ENROLLED) {
        await markEmailAsCancelled(id, `Prospect not enrolled (status: ${campaignProspect.enrollmentStatus})`);
        return { status: 'CANCELLED', error: 'Prospect not enrolled' };
    }

    // 3. Check quota
    const remainingQuota = await getRemainingQuota(workspaceId, new Date());
    if (remainingQuota <= 0) {
        console.log(`[EmailSender] Quota exceeded for workspace ${workspaceId}, will retry later`);
        return { status: 'QUOTA_EXCEEDED', retry: true };
    }

    // 4. Acquire lock (optimistic locking via status update)
    const locked = await markAsSending(id);
    if (!locked) {
        console.log(`[EmailSender] Email ${id} already being processed`);
        return { status: 'ALREADY_PROCESSING' };
    }

    try {
        // 5. Get Gmail token
        const { accessToken, email: fromEmail } = await getValidToken(workspaceId);

        // 6. Get sending settings for signature
        const sendingSettings = await prisma.sendingSettings.findUnique({
            where: { workspaceId },
        });

        // 7. Get thread context for follow-up emails
        const threadContext = await getThreadContext(campaignId, prospectId, stepNumber);

        // 8. Find the step content
        const step = sequence.steps.find(s => s.order === stepNumber);
        if (!step) {
            throw new Error(`Step ${stepNumber} not found in sequence ${sequence.id}`);
        }

        // 9. Get opener cache (if exists)
        const openerCache = await prisma.openerCache.findUnique({
            where: {
                workspaceId_prospectId_sequenceId_stepId: {
                    workspaceId,
                    prospectId,
                    sequenceId: sequence.id,
                    stepId: step.id,
                },
            },
        });

        // 10. Render email body with template variables
        const { subject: renderedSubject, body: renderedBody } = renderEmailBody({
            step,
            prospect,
            openerCache: openerCache?.openerText,
            signature: sendingSettings?.signature || undefined,
            forSend: true,
        });

        // 11. Determine final subject (with Re: for follow-ups)
        const finalSubject = threadContext
            ? getThreadedSubject(threadContext.originalSubject)
            : renderedSubject;

        // 12. Generate unsubscribe link
        const unsubscribeLink = generateUnsubscribeLink(prospectId, workspaceId);

        // 13. Compose RFC 2822 email
        const rawEmail = composeEmail({
            from: fromEmail,
            fromName: sendingSettings?.fromName || undefined,
            to: prospect.email,
            subject: finalSubject,
            body: renderedBody,
            unsubscribeLink,
            inReplyTo: threadContext?.inReplyTo,
            references: threadContext?.references,
        });

        // 14. Send via Gmail API
        const sendResult = await sendEmail(accessToken, {
            raw: rawEmail,
            threadId: threadContext?.threadId,
        });

        // 15. Record success in ScheduledEmail
        await markAsSent(id, sendResult.messageId, sendResult.threadId);

        // 16. Database Transaction: Create SentEmail, Conversation, and InboxMessage atomically
        const { messageId, threadId } = sendResult;
        const sentAt = new Date();

        await prisma.$transaction(async (tx) => {
            // A. Create SentEmail record for analytics
            await tx.sentEmail.create({
                data: {
                    workspaceId,
                    scheduledEmailId: id,
                    campaignId,
                    prospectId,
                    messageId,
                    threadId,
                    subject: finalSubject,
                    toAddress: prospect.email,
                    headers: buildHeadersJson({
                        from: fromEmail,
                        to: prospect.email,
                        subject: finalSubject,
                        messageId,
                        inReplyTo: threadContext?.inReplyTo,
                        references: threadContext?.references,
                    }),
                    sentAt,
                },
            });

            // B. Create or Update Conversation
            // We can't use the existing createOrUpdateConversation helper directly because it uses `prisma` global.
            // We need to reimplement logic with `tx` or refactor helper to accept prisma instance.
            // For now, inlining for transactional safety (or could refactor helper later)
            const conversation = await tx.conversation.upsert({
                where: {
                    workspaceId_threadId: {
                        workspaceId,
                        threadId,
                    },
                },
                create: {
                    threadId,
                    workspaceId,
                    prospectId,
                    campaignId,
                    sequenceId: sequence.id,
                    lastMessageAt: sentAt,
                    status: 'OPEN',
                },
                update: {
                    lastMessageAt: sentAt,
                    prospectId,           // Ensure link is up to date
                    campaignId,           // Ensure link is up to date
                    sequenceId: sequence.id,
                },
            });

            // C. Create OUTBOUND InboxMessage
            await tx.inboxMessage.upsert({
                where: {
                    conversationId_gmailMessageId: {
                        conversationId: conversation.id,
                        gmailMessageId: messageId,
                    },
                },
                create: {
                    conversationId: conversation.id,
                    gmailMessageId: messageId,
                    direction: 'OUTBOUND',
                    subject: finalSubject,
                    bodyRaw: renderedBody,
                    bodyCleaned: renderedBody, // Use rendered body for preview instead of null
                    fromEmail,
                    toEmail: prospect.email,
                    receivedAt: sentAt,
                    isRead: true, // Outbound is read by default
                },
                update: {},
            });
        });

        console.log(`[EmailSender] Successfully sent email ${id} (messageId: ${sendResult.messageId})`);

        return {
            status: 'SENT',
            messageId: sendResult.messageId,
            threadId: sendResult.threadId,
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[EmailSender] Failed to send email ${id}:`, errorMessage);

        // Handle the failure (retry or permanent failure)
        await handleEmailFailure(id, error instanceof Error ? error : errorMessage);

        // Determine if error is retryable
        const isRetryable = error instanceof GmailSendError ? error.isRetryable : true;

        return {
            status: 'FAILED',
            error: errorMessage,
            retry: isRetryable,
        };
    }
}

/**
 * Process all pending emails (called by cron)
 * 
 * @param limit - Maximum number of emails to process
 * @returns Statistics about the processing run
 */
export async function processPendingEmails(
    limit: number = MAX_EMAILS_PER_RUN
): Promise<EmailSendingStats> {
    const startTime = Date.now();
    const stats: EmailSendingStats = {
        processed: 0,
        sent: 0,
        skippedQuota: 0,
        cancelled: 0,
        failed: 0,
        durationMs: 0,
    };

    // Get pending emails
    const { getPendingEmails } = await import('./schedule-emails');
    const pendingEmails = await getPendingEmails(undefined, limit);

    console.log(`[EmailSender] Processing ${pendingEmails.length} pending emails`);

    // Process emails sequentially with delay
    for (let i = 0; i < pendingEmails.length; i++) {
        const email = pendingEmails[i];

        try {
            const result = await processScheduledEmail(email);
            stats.processed++;

            switch (result.status) {
                case 'SENT':
                    stats.sent++;
                    break;
                case 'QUOTA_EXCEEDED':
                    stats.skippedQuota++;
                    // Stop processing more emails if quota exceeded
                    console.log(`[EmailSender] Quota exceeded, stopping batch`);
                    break;
                case 'CANCELLED':
                    stats.cancelled++;
                    break;
                case 'FAILED':
                    stats.failed++;
                    break;
                case 'ALREADY_PROCESSING':
                    // Don't count as processed
                    stats.processed--;
                    break;
            }

            // If quota exceeded, stop processing
            if (result.status === 'QUOTA_EXCEEDED') {
                break;
            }

            // Add delay between emails (except for last one)
            if (i < pendingEmails.length - 1 && result.status === 'SENT') {
                await sleep(INTER_EMAIL_DELAY_MS);
            }
        } catch (error) {
            console.error(`[EmailSender] Unexpected error processing email ${email.id}:`, error);
            stats.failed++;
        }
    }

    stats.durationMs = Date.now() - startTime;

    console.log(
        `[EmailSender] Completed: sent=${stats.sent}, cancelled=${stats.cancelled}, ` +
        `failed=${stats.failed}, skippedQuota=${stats.skippedQuota}, duration=${stats.durationMs}ms`
    );

    // Story 5.8: Run anomaly detection after batch processing
    // Get unique workspace IDs from processed emails
    if (stats.processed > 0) {
        try {
            const { runAnomalyDetectionAndPause } = await import('./auto-pause');
            const workspaceIds = new Set(pendingEmails.map(e => e.workspaceId));
            for (const workspaceId of workspaceIds) {
                const paused = await runAnomalyDetectionAndPause(workspaceId);
                if (paused.length > 0) {
                    console.log(`[EmailSender] Auto-paused ${paused.length} campaigns in workspace ${workspaceId}`);
                }
            }
        } catch (error) {
            console.error('[EmailSender] Error running anomaly detection:', error);
        }
    }

    return stats;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
