/**
 * Inbox Sync Worker (Story 6.1)
 * 
 * Orchestrates the inbox sync process for all connected workspaces
 */

import { prisma } from '@/lib/prisma/client';
import { decrypt } from '@/lib/crypto/encrypt';
import {
    fetchNewMessages,
    fetchMessageDetails,
    isInboundMessage,
    isAuthError
} from '@/lib/gmail/inbox-sync';
import {
    matchThreadToSentEmail,
    createOrUpdateConversation,
    createInboxMessage,
    markProspectAsReplied,
    findCampaignProspect,
    findProspectByEmail,
} from './thread-matcher';
import { extractEmailAddress } from '@/lib/utils/email-body-parser';
import type { SyncResult, WorkspaceSyncResult, GmailMessageDetails } from '@/types/inbox';
import { GmailSendError } from '@/lib/gmail/sender';
import { applyClassification, classifyMessage } from './classification/classification-service';
import { handleClassificationActions } from './classification/auto-actions';

const CLASSIFICATION_RETRY_BATCH_SIZE = 25;

async function retryPendingClassifications(workspaceId: string): Promise<number> {
    const pendingMessages = await prisma.inboxMessage.findMany({
        where: {
            direction: 'INBOUND',
            classification: null,
            needsReview: true,
            conversation: {
                workspaceId,
            },
        },
        select: {
            id: true,
            direction: true,
            subject: true,
            bodyRaw: true,
            bodyCleaned: true,
            conversationId: true,
        },
        take: CLASSIFICATION_RETRY_BATCH_SIZE,
        orderBy: {
            receivedAt: 'asc',
        },
    });

    let retried = 0;

    for (const pendingMessage of pendingMessages) {
        const classificationResult = await classifyMessage(pendingMessage);
        await applyClassification(pendingMessage.id, classificationResult);

        if (classificationResult.classification && !classificationResult.needsReview) {
            await handleClassificationActions(
                { id: pendingMessage.id },
                classificationResult.classification,
                pendingMessage.conversationId
            );
        }

        retried++;
    }

    return retried;
}

/**
 * Process a single incoming message
 */
async function processIncomingMessage(
    message: GmailMessageDetails,
    workspaceId: string,
    ourEmail: string
): Promise<{ matched: boolean; error?: string }> {
    try {
        // Check if this is an inbound message (not sent by us)
        const isInbound = isInboundMessage(message, ourEmail);
        const direction = isInbound ? 'INBOUND' : 'OUTBOUND';

        // Only process inbound messages for reply detection
        // (outbound messages are already tracked via SentEmail)

        // Try to match thread to a sent email
        const sentEmail = await matchThreadToSentEmail(message.threadId, workspaceId);

        let prospectId: string | null = null;
        let campaignId: string | null = null;
        let sequenceId: string | null = null;

        if (sentEmail) {
            prospectId = sentEmail.prospectId;
            campaignId = sentEmail.campaignId;

            // Get sequence ID from the scheduled email
            const scheduledEmail = await prisma.scheduledEmail.findUnique({
                where: { id: sentEmail.scheduledEmailId },
                select: { sequenceId: true },
            });
            sequenceId = scheduledEmail?.sequenceId ?? null;
        } else if (isInbound) {
            // Try to find prospect by email for unlinked emails
            const fromEmail = extractEmailAddress(message.headers.from);
            const prospect = await findProspectByEmail(fromEmail, workspaceId);
            if (prospect) {
                prospectId = prospect.id;
            }
        }

        // Skip messages that don't match any sent thread AND don't match any known prospect
        // This prevents personal emails, newsletters, etc. from polluting the inbox
        if (!sentEmail && !prospectId) {
            return { matched: false };
        }

        // Create or update conversation
        const receivedAt = new Date(parseInt(message.internalDate, 10));
        const conversation = await createOrUpdateConversation({
            threadId: message.threadId,
            workspaceId,
            prospectId,
            campaignId,
            sequenceId,
            lastMessageAt: receivedAt,
        });

        // Create inbox message
        const inboxMessage = await createInboxMessage({
            conversationId: conversation.id,
            gmailMessageId: message.id,
            direction,
            subject: message.headers.subject || null,
            bodyRaw: message.body.raw,
            bodyCleaned: message.body.cleaned || null,
            fromEmail: extractEmailAddress(message.headers.from),
            toEmail: extractEmailAddress(message.headers.to),
            receivedAt,
        });

        if (isInbound) {
            try {
                const classificationResult = await classifyMessage(inboxMessage);
                await applyClassification(inboxMessage.id, classificationResult);

                console.log(
                    `[inbox-sync] Classification ${inboxMessage.id}: ${classificationResult.classification ?? 'NULL'} (confidence=${classificationResult.confidenceScore ?? 'n/a'}, needsReview=${classificationResult.needsReview})`
                );

                if (!classificationResult.needsReview) {
                    // Keep legacy "reply means replied" behavior while avoiding conflict with hard-stop classes.
                    if (
                        sentEmail &&
                        campaignId &&
                        prospectId &&
                        classificationResult.classification !== 'UNSUBSCRIBE' &&
                        classificationResult.classification !== 'BOUNCE'
                    ) {
                        const campaignProspect = await findCampaignProspect(prospectId, campaignId);
                        if (campaignProspect && campaignProspect.enrollmentStatus === 'ENROLLED') {
                            await markProspectAsReplied(campaignProspect.id);
                            console.log(`[inbox-sync] Marked prospect ${prospectId} as REPLIED in campaign ${campaignId}`);
                        }
                    }

                    if (classificationResult.classification) {
                        await handleClassificationActions(
                            { id: inboxMessage.id },
                            classificationResult.classification,
                            conversation.id
                        );
                    }
                }
            } catch (classificationError) {
                const errorMessage = classificationError instanceof Error ? classificationError.message : String(classificationError);
                console.error(`[inbox-sync] Classification pipeline error for message ${message.id}:`, errorMessage);
            }
        }

        return { matched: sentEmail !== null };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[inbox-sync] Error processing message ${message.id}:`, errorMessage);
        return { matched: false, error: errorMessage };
    }
}

/**
 * Sync inbox for a single workspace
 */
export async function syncWorkspaceInbox(
    workspaceId: string
): Promise<SyncResult> {
    const result: SyncResult = {
        processed: 0,
        matched: 0,
        unlinked: 0,
        errors: 0,
        errorDetails: [],
    };

    // Get workspace with Gmail token
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
            gmailToken: true,
        },
    });

    if (!workspace) {
        throw new Error(`Workspace ${workspaceId} not found`);
    }

    if (!workspace.gmailToken) {
        throw new Error(`Workspace ${workspaceId} has no Gmail token configured`);
    }

    // Decrypt access token
    const accessToken = decrypt(workspace.gmailToken.accessToken);
    const ourEmail = workspace.gmailToken.email;

    // Determine sync start time (last sync or 24 hours ago for first sync)
    const lastSyncedAt = workspace.lastSyncedAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch new messages
    const messages = await fetchNewMessages(accessToken, lastSyncedAt, 100);
    console.log(`[inbox-sync] Found ${messages.length} new messages for workspace ${workspaceId}`);

    // Process each message
    for (const message of messages) {
        try {
            const details = await fetchMessageDetails(accessToken, message.id);
            const processResult = await processIncomingMessage(details, workspaceId, ourEmail);

            result.processed++;
            if (processResult.matched) {
                result.matched++;
            } else {
                result.unlinked++;
            }

            if (processResult.error) {
                result.errors++;
                result.errorDetails?.push(`${message.id}: ${processResult.error}`);
            }
        } catch (error) {
            result.errors++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.errorDetails?.push(`${message.id}: ${errorMessage}`);
            console.error(`[inbox-sync] Failed to process message ${message.id}:`, errorMessage);
        }

        // Small delay between messages to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Retry messages left unclassified by previous LLM failures.
    try {
        const retried = await retryPendingClassifications(workspaceId);
        if (retried > 0) {
            console.log(`[inbox-sync] Retried classification for ${retried} pending message(s)`);
        }
    } catch (retryError) {
        const retryErrorMessage = retryError instanceof Error ? retryError.message : String(retryError);
        console.error(`[inbox-sync] Failed to retry pending classifications for workspace ${workspaceId}:`, retryErrorMessage);
    }

    // Update last synced timestamp
    await prisma.workspace.update({
        where: { id: workspaceId },
        data: { lastSyncedAt: new Date() },
    });

    return result;
}

/**
 * Process all workspaces with Gmail connected
 */
export async function processAllWorkspaces(): Promise<WorkspaceSyncResult[]> {
    const results: WorkspaceSyncResult[] = [];

    // Get all workspaces with Gmail tokens
    const workspaces = await prisma.workspace.findMany({
        where: {
            gmailToken: {
                isNot: null,
            },
        },
        select: {
            id: true,
        },
    });

    console.log(`[inbox-sync] Processing ${workspaces.length} workspaces`);

    for (const workspace of workspaces) {
        const startTime = Date.now();

        try {
            const syncResult = await syncWorkspaceInbox(workspace.id);

            results.push({
                workspaceId: workspace.id,
                success: true,
                result: syncResult,
                duration: Date.now() - startTime,
            });

            console.log(`[inbox-sync] Workspace ${workspace.id} synced: ${syncResult.processed} processed, ${syncResult.matched} matched, ${syncResult.errors} errors`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Handle auth errors by marking workspace as disconnected
            if (error instanceof GmailSendError && isAuthError(error.statusCode)) {
                console.error(`[inbox-sync] Auth error for workspace ${workspace.id}, marking as disconnected`);

                await prisma.gmailToken.update({
                    where: { workspaceId: workspace.id },
                    data: {
                        isValid: false,
                        lastAuthError: errorMessage
                    }
                });
            }

            results.push({
                workspaceId: workspace.id,
                success: false,
                error: errorMessage,
                duration: Date.now() - startTime,
            });

            console.error(`[inbox-sync] Workspace ${workspace.id} sync failed:`, errorMessage);
        }
    }

    return results;
}
