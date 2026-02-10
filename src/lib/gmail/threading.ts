/**
 * Gmail Threading Service
 * Story 5.5: Gmail API Email Sending with Threading
 * 
 * Handles thread context lookup for follow-up emails
 */

import { prisma } from '@/lib/prisma/client';
import type { ThreadContext } from './compose-email';

/**
 * Get thread context for a follow-up email
 * 
 * For step 1: Returns null (new thread)
 * For step 2+: Looks up the step 1 email's threadId and messageId
 * 
 * @param campaignId - Campaign ID
 * @param prospectId - Prospect ID
 * @param stepNumber - Current step number (1, 2, or 3)
 * @returns ThreadContext if previous email was sent, null otherwise
 */
export async function getThreadContext(
    campaignId: string,
    prospectId: string,
    stepNumber: number
): Promise<ThreadContext | null> {
    // Step 1 always starts a new thread
    if (stepNumber === 1) {
        return null;
    }

    // Look for the first sent email (step 1) to get thread context
    // We use SentEmail because it contains the actual Gmail IDs
    const firstSentEmail = await prisma.sentEmail.findFirst({
        where: {
            campaignId,
            prospectId,
            // Get the step 1 email (thread starter)
            scheduledEmail: {
                stepNumber: 1,
            },
        },
        orderBy: { sentAt: 'asc' },
        select: {
            messageId: true,
            threadId: true,
            subject: true,
        },
    });

    if (!firstSentEmail) {
        // No previous email found - this could be:
        // 1. Step 1 wasn't sent yet (shouldn't happen if workflow is correct)
        // 2. Step 1 failed and we're still processing step 2 (edge case)
        // In this case, start a new thread
        console.warn(
            `No previous sent email found for campaign=${campaignId}, prospect=${prospectId}, step=${stepNumber}. Starting new thread.`
        );
        return null;
    }

    // Format Message-ID as a proper email header value
    // Gmail returns just the ID, we need to format it as <id@mail.gmail.com>
    const formattedMessageId = formatMessageIdHeader(firstSentEmail.messageId);

    return {
        threadId: firstSentEmail.threadId,
        inReplyTo: formattedMessageId,
        references: formattedMessageId,
        originalSubject: firstSentEmail.subject,
    };
}

/**
 * Format a Gmail message ID as a Message-ID header value
 * Gmail returns bare IDs like "18e1234567890abc"
 * We need to format them as "<18e1234567890abc@mail.gmail.com>"
 */
function formatMessageIdHeader(messageId: string): string {
    // If already formatted, return as-is
    if (messageId.startsWith('<') && messageId.endsWith('>')) {
        return messageId;
    }

    return `<${messageId}@mail.gmail.com>`;
}

/**
 * Get the most recent sent email for a prospect in a campaign
 * Useful for getting the latest thread context
 */
export async function getLatestSentEmail(
    campaignId: string,
    prospectId: string
): Promise<{
    messageId: string;
    threadId: string;
    subject: string;
    stepNumber: number;
} | null> {
    const latestEmail = await prisma.sentEmail.findFirst({
        where: {
            campaignId,
            prospectId,
        },
        orderBy: { sentAt: 'desc' },
        select: {
            messageId: true,
            threadId: true,
            subject: true,
            scheduledEmail: {
                select: { stepNumber: true },
            },
        },
    });

    if (!latestEmail) {
        return null;
    }

    return {
        messageId: latestEmail.messageId,
        threadId: latestEmail.threadId,
        subject: latestEmail.subject,
        stepNumber: latestEmail.scheduledEmail.stepNumber,
    };
}

/**
 * Check if all previous steps have been sent for a prospect
 * Important for ensuring proper sequence order
 */
export async function arePreviousStepsSent(
    campaignId: string,
    prospectId: string,
    currentStepNumber: number
): Promise<boolean> {
    if (currentStepNumber === 1) {
        return true; // No previous steps for step 1
    }

    // Count sent emails for previous steps
    const sentCount = await prisma.sentEmail.count({
        where: {
            campaignId,
            prospectId,
            scheduledEmail: {
                stepNumber: { lt: currentStepNumber },
            },
        },
    });

    // Should have (currentStepNumber - 1) sent emails
    return sentCount >= currentStepNumber - 1;
}
