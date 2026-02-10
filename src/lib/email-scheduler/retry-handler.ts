/**
 * Retry Handler Service
 * Story 5.4: Email Scheduling Queue (DB Pillar with Idempotency)
 * 
 * Handles email failures with exponential backoff retry logic
 */

import { prisma } from '@/lib/prisma/client';
import { ScheduledEmailStatus } from '@prisma/client';
import {
    MAX_RETRY_ATTEMPTS,
    RETRY_BACKOFF_MINUTES,
    RETRYABLE_ERROR_CODES,
    NON_RETRYABLE_ERROR_CODES
} from '@/types/scheduled-email';
import {
    GMAIL_RETRYABLE_ERRORS,
    GMAIL_NON_RETRYABLE_ERRORS
} from '@/lib/gmail/sender';

/**
 * Check if an error is retryable
 * 
 * @param error - The error to check
 * @returns true if the error is retryable
 */
export function isRetryableError(error: Error | string): boolean {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorCode = extractErrorCode(errorMessage);

    // Check if it's a known non-retryable error
    if (NON_RETRYABLE_ERROR_CODES.some(code => errorMessage.includes(code) || errorCode === code)) {
        return false;
    }

    // Check Gmail specific non-retryable errors
    if (GMAIL_NON_RETRYABLE_ERRORS.some(code => errorMessage.includes(code) || errorCode === code)) {
        return false;
    }

    // Check if it's a known retryable error
    if (RETRYABLE_ERROR_CODES.some(code => errorMessage.includes(code) || errorCode === code)) {
        return true;
    }

    // Check Gmail specific retryable errors
    if (GMAIL_RETRYABLE_ERRORS.some(code => errorMessage.includes(code) || errorCode === code)) {
        return true;
    }

    // Default: consider network-like errors as retryable
    const networkErrorPatterns = [
        /timeout/i,
        /timed.?out/i, // Also matches "timed out"
        /connection/i,
        /network/i,
        /econnreset/i,
        /etimedout/i,
        /rate.?limit/i,
        /too.?many.?requests/i,
        /5\d{2}/i, // 5xx status codes
        /temporarily/i,
        /unavailable/i,
    ];

    return networkErrorPatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Extract error code from error message
 */
function extractErrorCode(message: string): string {
    // Common patterns: "Error: CODE_HERE:" or "CODE_HERE: description"
    const codeMatch = message.match(/^([A-Z_]+):|Error:\s*([A-Z_]+)/);
    return codeMatch?.[1] || codeMatch?.[2] || '';
}

/**
 * Calculate the next retry time using exponential backoff
 * 
 * @param attempts - Current number of attempts (0-indexed)
 * @returns The number of minutes to wait before next retry
 */
export function calculateBackoffMinutes(attempts: number): number {
    if (attempts < 0) return RETRY_BACKOFF_MINUTES[0];
    if (attempts >= RETRY_BACKOFF_MINUTES.length) {
        return RETRY_BACKOFF_MINUTES[RETRY_BACKOFF_MINUTES.length - 1];
    }
    return RETRY_BACKOFF_MINUTES[attempts];
}

/**
 * Calculate the next retry date
 * 
 * @param attempts - Current number of attempts (0-indexed)
 * @returns The date/time of the next retry
 */
export function calculateNextRetryAt(attempts: number): Date {
    const backoffMinutes = calculateBackoffMinutes(attempts);
    const nextRetry = new Date();
    nextRetry.setMinutes(nextRetry.getMinutes() + backoffMinutes);
    return nextRetry;
}

/**
 * Handle an email failure - determine retry or permanent failure
 * 
 * @param scheduledEmailId - The scheduled email ID
 * @param error - The error that occurred
 */
export async function handleEmailFailure(
    scheduledEmailId: string,
    error: Error | string
): Promise<void> {
    const errorMessage = typeof error === 'string' ? error : error.message;

    // Get current scheduled email
    const scheduledEmail = await prisma.scheduledEmail.findUnique({
        where: { id: scheduledEmailId },
    });

    if (!scheduledEmail) {
        console.error(`[RetryHandler] ScheduledEmail not found: ${scheduledEmailId}`);
        return;
    }

    const newAttempts = scheduledEmail.attempts + 1;

    // Determine if we should retry
    const shouldRetry = isRetryableError(error) && newAttempts < MAX_RETRY_ATTEMPTS;

    if (shouldRetry) {
        // Schedule retry with exponential backoff
        const nextRetryAt = calculateNextRetryAt(scheduledEmail.attempts);

        await prisma.scheduledEmail.update({
            where: { id: scheduledEmailId },
            data: {
                status: ScheduledEmailStatus.RETRY_SCHEDULED,
                attempts: newAttempts,
                lastError: errorMessage,
                nextRetryAt,
            },
        });

        console.log(
            `[RetryHandler] Scheduled retry for ${scheduledEmailId} at ${nextRetryAt.toISOString()} (attempt ${newAttempts}/${MAX_RETRY_ATTEMPTS})`
        );
    } else {
        // Mark as permanently failed
        const reason = isRetryableError(error)
            ? `Max retries exceeded (${newAttempts}/${MAX_RETRY_ATTEMPTS})`
            : 'Non-retryable error';

        await prisma.scheduledEmail.update({
            where: { id: scheduledEmailId },
            data: {
                status: ScheduledEmailStatus.PERMANENTLY_FAILED,
                attempts: newAttempts,
                lastError: `${reason}: ${errorMessage}`,
                nextRetryAt: null,
            },
        });

        console.log(
            `[RetryHandler] Marked ${scheduledEmailId} as PERMANENTLY_FAILED: ${reason}`
        );
    }
}

/**
 * Mark an email as sending (acquire lock)
 * 
 * @param scheduledEmailId - The scheduled email ID
 * @returns true if lock was acquired, false if already being sent
 */
export async function markAsSending(scheduledEmailId: string): Promise<boolean> {
    try {
        // Use optimistic locking - only update if status is SCHEDULED or RETRY_SCHEDULED
        const result = await prisma.scheduledEmail.updateMany({
            where: {
                id: scheduledEmailId,
                status: {
                    in: [ScheduledEmailStatus.SCHEDULED, ScheduledEmailStatus.RETRY_SCHEDULED],
                },
            },
            data: {
                status: ScheduledEmailStatus.SENDING,
            },
        });

        return result.count > 0;
    } catch (error) {
        console.error(`[RetryHandler] Failed to acquire lock for ${scheduledEmailId}:`, error);
        return false;
    }
}

/**
 * Mark an email as successfully sent
 * 
 * @param scheduledEmailId - The scheduled email ID
 * @param messageId - The Gmail message ID
 * @param threadId - The Gmail thread ID
 */
export async function markAsSent(
    scheduledEmailId: string,
    messageId: string,
    threadId: string
): Promise<void> {
    await prisma.scheduledEmail.update({
        where: { id: scheduledEmailId },
        data: {
            status: ScheduledEmailStatus.SENT,
            messageId,
            threadId,
            sentAt: new Date(),
        },
    });

    console.log(`[RetryHandler] Marked ${scheduledEmailId} as SENT (messageId: ${messageId})`);
}

/**
 * Cancel all pending emails for a campaign
 * 
 * @param campaignId - The campaign ID
 * @returns The number of emails cancelled
 */
export async function cancelCampaignEmails(campaignId: string): Promise<number> {
    const result = await prisma.scheduledEmail.updateMany({
        where: {
            campaignId,
            status: {
                in: [
                    ScheduledEmailStatus.SCHEDULED,
                    ScheduledEmailStatus.RETRY_SCHEDULED,
                ],
            },
        },
        data: {
            status: ScheduledEmailStatus.CANCELLED,
        },
    });

    console.log(`[RetryHandler] Cancelled ${result.count} emails for campaign ${campaignId}`);
    return result.count;
}

/**
 * Cancel all pending emails for a prospect enrollment
 * 
 * @param campaignProspectId - The campaign prospect enrollment ID
 * @returns The number of emails cancelled
 */
export async function cancelProspectEmails(campaignProspectId: string): Promise<number> {
    const result = await prisma.scheduledEmail.updateMany({
        where: {
            campaignProspectId,
            status: {
                in: [
                    ScheduledEmailStatus.SCHEDULED,
                    ScheduledEmailStatus.RETRY_SCHEDULED,
                ],
            },
        },
        data: {
            status: ScheduledEmailStatus.CANCELLED,
        },
    });

    console.log(`[RetryHandler] Cancelled ${result.count} emails for enrollment ${campaignProspectId}`);
    return result.count;
}

/**
 * Mark a single email as cancelled with a reason
 * 
 * @param scheduledEmailId - The scheduled email ID
 * @param reason - The cancellation reason
 */
export async function markEmailAsCancelled(
    scheduledEmailId: string,
    reason: string
): Promise<void> {
    await prisma.scheduledEmail.update({
        where: { id: scheduledEmailId },
        data: {
            status: ScheduledEmailStatus.CANCELLED,
            lastError: reason,
        },
    });

    console.log(`[RetryHandler] Cancelled email ${scheduledEmailId}: ${reason}`);
}

