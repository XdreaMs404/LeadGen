import type { ConversationStatus, MessageDirection, ReplyClassification } from '@prisma/client';

// ============================================
// Conversation Types
// ============================================

export interface Conversation {
    id: string;
    threadId: string;
    workspaceId: string;
    prospectId: string | null;
    campaignId: string | null;
    sequenceId: string | null;
    status: ConversationStatus;
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
    messages?: InboxMessage[];
}

export interface ConversationWithProspect extends Conversation {
    prospect?: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        company: string | null;
    } | null;
    campaign?: {
        id: string;
        name: string;
    } | null;
}

/**
 * Full conversation with all messages and related data
 * Used for conversation detail view (AC3)
 */
export interface ConversationWithMessages extends Conversation {
    prospect?: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        jobTitle?: string | null;
    } | null;
    campaign?: {
        id: string;
        name: string;
        status?: string;
    } | null;
    sequence?: {
        id: string;
        name: string;
    } | null;
    messages: InboxMessage[];
}

/**
 * Conversation list item for inbox view
 * Includes last message preview and unread count
 */
export interface ConversationListItem extends ConversationWithProspect {
    lastMessage?: InboxMessage | null;
    unreadCount?: number;
}

// ============================================
// InboxMessage Types
// ============================================

export interface InboxMessage {
    id: string;
    conversationId: string;
    gmailMessageId: string;
    direction: MessageDirection;
    subject: string | null;
    bodyRaw: string;
    bodyCleaned: string | null;
    fromEmail: string;
    toEmail: string;
    receivedAt: string;
    classification: ReplyClassification | null;
    isRead: boolean;
    createdAt: string;
}

// ============================================
// Gmail API Types
// ============================================

export interface GmailMessage {
    id: string;
    threadId: string;
}

export interface GmailMessageDetails {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    headers: {
        from: string;
        to: string;
        subject: string;
        date: string;
        messageId: string;
        inReplyTo?: string;
        references?: string;
    };
    body: {
        raw: string;
        cleaned: string;
    };
    internalDate: string;
}

export interface GmailMessageListResponse {
    messages?: GmailMessage[];
    nextPageToken?: string;
    resultSizeEstimate: number;
}

// ============================================
// Sync Result Types
// ============================================

export interface SyncResult {
    processed: number;
    matched: number;
    unlinked: number;
    errors: number;
    errorDetails?: string[];
}

export interface WorkspaceSyncResult {
    workspaceId: string;
    success: boolean;
    result?: SyncResult;
    error?: string;
    duration: number;
}

// ============================================
// Request/Response Types for API
// ============================================

export interface ConversationListResponse {
    conversations: ConversationWithProspect[];
    total: number;
}

export interface InboxMessageListResponse {
    messages: InboxMessage[];
    total: number;
}

// Re-export enums for convenience
export { ConversationStatus, MessageDirection, ReplyClassification };
