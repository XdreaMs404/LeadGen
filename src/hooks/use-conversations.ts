'use client';

/**
 * TanStack Query hooks for conversations (Story 6.2 AC5)
 * 
 * Provides hooks for:
 * - useConversations: List all conversations for workspace
 * - useConversation: Single conversation with messages
 * - useProspectConversations: Conversations for a prospect
 * - useUnreadCount: Unread message count for inbox badge
 */

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWorkspace } from '@/hooks/use-workspace';
import type {
    ConversationWithProspect,
    ConversationWithMessages,
    ConversationListResponse,
} from '@/types/inbox';
import type { ConversationStatus, ReplyClassification } from '@prisma/client';
import type { ApiResponse } from '@/lib/utils/api-response';

// ===== Query Key Factory =====

export const conversationKeys = {
    all: ['conversations'] as const,
    lists: () => [...conversationKeys.all, 'list'] as const,
    list: (workspaceId: string, filters?: ConversationFilters) =>
        [...conversationKeys.lists(), workspaceId, filters] as const,
    details: () => [...conversationKeys.all, 'detail'] as const,
    detail: (conversationId: string) =>
        [...conversationKeys.details(), conversationId] as const,
    prospect: (prospectId: string) =>
        [...conversationKeys.all, 'prospect', prospectId] as const,
    unread: (workspaceId: string) =>
        [...conversationKeys.all, 'unread', workspaceId] as const,
};

// ===== Filter Types =====

export interface ConversationFilters {
    status?: ConversationStatus;
    hasUnread?: boolean;
    classification?: ReplyClassification[];
    needsReview?: boolean;
    sortByPriority?: boolean;
    search?: string;
    dateFrom?: string | Date;
    dateTo?: string | Date;
    page?: number;
    limit?: number;
}

// ===== useConversations Hook =====

/**
 * Hook for fetching paginated conversations for the current workspace
 * Used by unified inbox UI
 */
export function useConversations(filters?: ConversationFilters) {
    const { workspaceId } = useWorkspace();
    const serializeDate = (value?: string | Date) => {
        if (!value) return null;
        return value instanceof Date ? value.toISOString() : value;
    };

    return useQuery({
        queryKey: conversationKeys.list(workspaceId || '', filters),
        queryFn: async (): Promise<ConversationListResponse> => {
            const params = new URLSearchParams();
            if (filters?.status) params.set('status', filters.status);
            if (filters?.hasUnread) params.set('unread', 'true');
            if (filters?.needsReview) params.set('needsReview', 'true');
            if (filters?.sortByPriority === false) params.set('sortByPriority', 'false');
            if (filters?.classification && filters.classification.length > 0) {
                params.set('classification', filters.classification.join(','));
            }
            if (filters?.search?.trim()) params.set('search', filters.search.trim());
            const dateFrom = serializeDate(filters?.dateFrom);
            if (dateFrom) params.set('dateFrom', dateFrom);
            const dateTo = serializeDate(filters?.dateTo);
            if (dateTo) params.set('dateTo', dateTo);
            if (filters?.page) params.set('page', filters.page.toString());
            if (filters?.limit) params.set('limit', filters.limit.toString());

            const res = await fetch(`/api/inbox/conversations?${params}`);
            const json: ApiResponse<ConversationListResponse> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        placeholderData: keepPreviousData,
        enabled: !!workspaceId,
    });
}

/**
 * Alias explicite pour la page Inbox
 */
export function useInboxConversations(filters?: ConversationFilters) {
    return useConversations(filters);
}

// ===== useConversation Hook =====

/**
 * Hook for fetching a single conversation with all messages
 * Used by conversation detail view
 */
export function useConversation(conversationId: string | null) {
    const { workspaceId } = useWorkspace();

    return useQuery({
        queryKey: conversationKeys.detail(conversationId || ''),
        queryFn: async (): Promise<ConversationWithMessages> => {
            const res = await fetch(`/api/inbox/conversations/${conversationId}`);
            const json: ApiResponse<{ conversation: ConversationWithMessages }> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data.conversation;
        },
        enabled: !!workspaceId && !!conversationId,
    });
}

// ===== useProspectConversations Hook =====

/**
 * Hook for fetching all conversations for a specific prospect
 * Used by prospect detail page
 */
export function useProspectConversations(prospectId: string | null) {
    const { workspaceId } = useWorkspace();

    return useQuery({
        queryKey: conversationKeys.prospect(prospectId || ''),
        queryFn: async (): Promise<ConversationWithProspect[]> => {
            const res = await fetch(`/api/prospects/${prospectId}/conversations`);
            const json: ApiResponse<{ conversations: ConversationWithProspect[] }> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data.conversations;
        },
        enabled: !!workspaceId && !!prospectId,
    });
}

// ===== useUnreadCount Hook =====

/**
 * Hook for fetching unread message count
 * Used for inbox badge in navigation
 */
export function useUnreadCount() {
    const { workspaceId } = useWorkspace();

    return useQuery({
        queryKey: conversationKeys.unread(workspaceId || ''),
        queryFn: async (): Promise<number> => {
            const res = await fetch('/api/inbox/unread-count');
            const json: ApiResponse<{ count: number }> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data.count;
        },
        enabled: !!workspaceId,
        refetchInterval: 60000, // Refresh every minute
    });
}

// ===== useMarkAsRead Mutation =====

/**
 * Hook for marking a conversation as read
 */
export function useMarkAsRead() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async (conversationId: string): Promise<{ marked: number }> => {
            const res = await fetch(`/api/inbox/conversations/${conversationId}/read`, {
                method: 'POST',
            });
            const json: ApiResponse<{ marked: number }> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: (_, conversationId) => {
            // Invalidate related queries
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
                queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) });
                queryClient.invalidateQueries({ queryKey: conversationKeys.unread(workspaceId) });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors du marquage comme lu');
        },
    });
}
