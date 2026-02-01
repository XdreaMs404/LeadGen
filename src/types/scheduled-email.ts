/**
 * Scheduled Email Types
 * Story 5.4: Email Scheduling Queue (DB Pillar with Idempotency)
 */

import type { ScheduledEmailStatus } from '@prisma/client';

/**
 * ScheduledEmail entity (mapped from Prisma)
 */
export interface ScheduledEmail {
    id: string;
    workspaceId: string;
    campaignId: string;
    campaignProspectId: string;
    prospectId: string;
    sequenceId: string;
    stepNumber: number;
    idempotencyKey: string;
    status: ScheduledEmailStatus;
    scheduledFor: Date;
    attempts: number;
    lastError: string | null;
    nextRetryAt: Date | null;
    messageId: string | null;
    threadId: string | null;
    sentAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Input for creating a scheduled email
 */
export interface CreateScheduledEmailInput {
    workspaceId: string;
    campaignId: string;
    campaignProspectId: string;
    prospectId: string;
    sequenceId: string;
    stepNumber: number;
    idempotencyKey: string;
    scheduledFor: Date;
}

/**
 * Response type for scheduled email queries
 */
export interface ScheduledEmailResponse {
    id: string;
    workspaceId: string;
    campaignId: string;
    campaignProspectId: string;
    prospectId: string;
    sequenceId: string;
    stepNumber: number;
    idempotencyKey: string;
    status: ScheduledEmailStatus;
    scheduledFor: string; // ISO format
    attempts: number;
    lastError: string | null;
    nextRetryAt: string | null; // ISO format
    messageId: string | null;
    threadId: string | null;
    sentAt: string | null; // ISO format
    createdAt: string;
    updatedAt: string;
}

/**
 * Result of scheduling emails for a campaign
 */
export interface SchedulingResult {
    scheduled: number;
    skipped: number;
    errors: string[];
}

/**
 * Constants for retry logic
 */
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_BACKOFF_MINUTES = [1, 5, 15]; // Exponential backoff

/**
 * Random delay range for human-like sending (seconds)
 */
export const RANDOM_DELAY_RANGE = {
    min: 30,
    max: 90,
};

/**
 * Retryable error codes - network/temporary issues
 */
export const RETRYABLE_ERROR_CODES = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'RATE_LIMIT_EXCEEDED',
    'TEMPORARY_FAILURE',
    'SERVICE_UNAVAILABLE',
    'NETWORK_ERROR',
    'CONNECTION_ERROR',
] as const;

/**
 * Non-retryable error codes - permanent failures
 */
export const NON_RETRYABLE_ERROR_CODES = [
    'INVALID_RECIPIENT',
    'AUTH_REVOKED',
    'TOKEN_EXPIRED',
    'MAIL_HARD_BOUNCE',
    'PERMISSION_DENIED',
    'INVALID_EMAIL',
    'RECIPIENT_NOT_FOUND',
] as const;
