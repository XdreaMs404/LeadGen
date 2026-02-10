/**
 * SentEmail Types
 * Story 5.5: Gmail API Email Sending with Threading
 */

/**
 * SentEmail entity (mapped from Prisma)
 */
export interface SentEmail {
    id: string;
    workspaceId: string;
    scheduledEmailId: string;
    campaignId: string;
    prospectId: string;
    messageId: string;
    threadId: string;
    subject: string;
    toAddress: string;
    headers: Record<string, string> | null;
    sentAt: Date;
    createdAt: Date;
}

/**
 * SentEmail response for API (dates as ISO strings)
 */
export interface SentEmailResponse {
    id: string;
    workspaceId: string;
    scheduledEmailId: string;
    campaignId: string;
    prospectId: string;
    messageId: string;
    threadId: string;
    subject: string;
    toAddress: string;
    headers: Record<string, string> | null;
    sentAt: string;
    createdAt: string;
}

/**
 * Input for creating a SentEmail record
 */
export interface CreateSentEmailInput {
    workspaceId: string;
    scheduledEmailId: string;
    campaignId: string;
    prospectId: string;
    messageId: string;
    threadId: string;
    subject: string;
    toAddress: string;
    headers?: Record<string, string>;
    sentAt: Date;
}

/**
 * Gmail send parameters
 */
export interface SendEmailParams {
    /** RFC 2822 formatted email, base64url encoded */
    raw: string;
    /** Gmail thread ID for threading (optional, for follow-ups) */
    threadId?: string;
}

/**
 * Result from Gmail API send operation
 */
export interface SendEmailResult {
    /** Gmail message ID */
    messageId: string;
    /** Gmail thread ID */
    threadId: string;
    /** Gmail labels (usually ['SENT']) */
    labelIds: string[];
}

/**
 * Thread context for follow-up emails
 */
export interface ThreadContext {
    /** Gmail thread ID */
    threadId: string;
    /** In-Reply-To header value */
    inReplyTo: string;
    /** References header value */
    references: string;
    /** Original subject for Re: prefix */
    originalSubject: string;
}

/**
 * Result of processing a scheduled email
 */
export interface EmailProcessResult {
    /** Processing outcome */
    status: 'SENT' | 'QUOTA_EXCEEDED' | 'CANCELLED' | 'FAILED' | 'ALREADY_PROCESSING' | 'SKIPPED';
    /** Gmail message ID (if sent) */
    messageId?: string;
    /** Gmail thread ID (if sent) */
    threadId?: string;
    /** Error message (if failed) */
    error?: string;
    /** Whether to retry (true for transient failures) */
    retry?: boolean;
}

/**
 * Email sending statistics
 */
export interface EmailSendingStats {
    /** Total emails processed */
    processed: number;
    /** Successfully sent */
    sent: number;
    /** Skipped due to quota */
    skippedQuota: number;
    /** Cancelled (campaign/enrollment status) */
    cancelled: number;
    /** Failed with error */
    failed: number;
    /** Processing time in milliseconds */
    durationMs: number;
}
