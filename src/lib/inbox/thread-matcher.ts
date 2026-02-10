/**
 * Thread Matching Service (Story 6.1)
 * 
 * Matches incoming Gmail threads to sent emails and manages conversations
 */

import { prisma } from '@/lib/prisma/client';
import type { Conversation, SentEmail, CampaignProspect } from '@prisma/client';

/**
 * Data for creating or updating a conversation
 */
export interface ConversationData {
    threadId: string;
    workspaceId: string;
    prospectId: string | null;
    campaignId: string | null;
    sequenceId: string | null;
    lastMessageAt: Date;
}

/**
 * Match a Gmail thread to a sent email in our database
 * Returns null if no match found (unlinked email)
 */
export async function matchThreadToSentEmail(
    threadId: string,
    workspaceId: string
): Promise<SentEmail | null> {
    const sentEmail = await prisma.sentEmail.findFirst({
        where: {
            threadId,
            workspaceId,
        },
        orderBy: {
            sentAt: 'desc',
        },
    });

    return sentEmail;
}

/**
 * Create or update a conversation for a thread
 * Uses upsert on (workspaceId, threadId) unique constraint
 */
export async function createOrUpdateConversation(
    data: ConversationData
): Promise<Conversation> {
    const conversation = await prisma.conversation.upsert({
        where: {
            workspaceId_threadId: {
                workspaceId: data.workspaceId,
                threadId: data.threadId,
            },
        },
        create: {
            threadId: data.threadId,
            workspaceId: data.workspaceId,
            prospectId: data.prospectId,
            campaignId: data.campaignId,
            sequenceId: data.sequenceId,
            lastMessageAt: data.lastMessageAt,
            status: 'OPEN',
        },
        update: {
            lastMessageAt: data.lastMessageAt,
            // Update prospect/campaign link if we now have a match
            ...(data.prospectId && { prospectId: data.prospectId }),
            ...(data.campaignId && { campaignId: data.campaignId }),
            ...(data.sequenceId && { sequenceId: data.sequenceId }),
        },
    });

    return conversation;
}

/**
 * Mark a prospect as having replied and cancel their pending scheduled emails
 * Reuses pattern from Story 5.7
 */
export async function markProspectAsReplied(
    campaignProspectId: string
): Promise<void> {
    // Update enrollment status to REPLIED
    await prisma.campaignProspect.update({
        where: { id: campaignProspectId },
        data: {
            enrollmentStatus: 'REPLIED',
        },
    });

    // Cancel all scheduled emails for this prospect (same pattern as Story 5.7)
    await prisma.scheduledEmail.updateMany({
        where: {
            campaignProspectId,
            status: {
                in: ['SCHEDULED', 'RETRY_SCHEDULED'],
            },
        },
        data: {
            status: 'CANCELLED',
        },
    });
}

/**
 * Find campaign prospect by prospect ID and campaign ID
 */
export async function findCampaignProspect(
    prospectId: string,
    campaignId: string
): Promise<CampaignProspect | null> {
    return prisma.campaignProspect.findUnique({
        where: {
            campaignId_prospectId: {
                campaignId,
                prospectId,
            },
        },
    });
}

/**
 * Create an inbox message for a conversation
 */
export async function createInboxMessage(data: {
    conversationId: string;
    gmailMessageId: string;
    direction: 'INBOUND' | 'OUTBOUND';
    subject: string | null;
    bodyRaw: string;
    bodyCleaned: string | null;
    fromEmail: string;
    toEmail: string;
    receivedAt: Date;
}) {
    // Use upsert to handle duplicate message IDs gracefully
    return prisma.inboxMessage.upsert({
        where: {
            conversationId_gmailMessageId: {
                conversationId: data.conversationId,
                gmailMessageId: data.gmailMessageId,
            },
        },
        create: {
            conversationId: data.conversationId,
            gmailMessageId: data.gmailMessageId,
            direction: data.direction,
            subject: data.subject,
            bodyRaw: data.bodyRaw,
            bodyCleaned: data.bodyCleaned,
            fromEmail: data.fromEmail,
            toEmail: data.toEmail,
            receivedAt: data.receivedAt,
            isRead: false,
        },
        update: {
            // Message already exists, no update needed
        },
    });
}

/**
 * Try to find a prospect by email address within a workspace
 * Used for inferring prospect from unlinked emails
 */
export async function findProspectByEmail(
    email: string,
    workspaceId: string
): Promise<{ id: string } | null> {
    return prisma.prospect.findUnique({
        where: {
            workspaceId_email: {
                workspaceId,
                email: email.toLowerCase(),
            },
        },
        select: { id: true },
    });
}
