'use client';

/**
 * Unified Inbox Page (Story 6.3)
 * 
 * Displays all conversations with prospects in a centralized inbox view.
 * Features:
 * - Conversation list with filtering and search
 * - Conversation detail panel with full thread
 * - Keyboard navigation
 * - Mark as read functionality
 */

import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { useConversations, useConversation, useMarkAsRead, useUnreadCount, ConversationFilters } from '@/hooks/use-conversations';
import { ConversationList } from '@/components/features/inbox/ConversationList';
import { ConversationDetail } from '@/components/features/inbox/ConversationDetail';
import { InboxFilters } from '@/components/features/inbox/InboxFilters';
import { InboxEmptyState } from '@/components/features/inbox/InboxEmptyState';
import { InboxSkeleton } from '@/components/features/inbox/InboxSkeleton';
import { useInboxKeyboardNav } from '@/hooks/use-inbox-keyboard-nav';
import type { ConversationWithProspect } from '@/types/inbox';

export default function InboxPage() {
    // State
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [filters, setFilters] = useState<ConversationFilters>({
        page: 1,
        limit: 25,
    });

    // Queries
    const { data: listData, isLoading: isLoadingList, error: listError } = useConversations(filters);
    const { data: conversationDetail, isLoading: isLoadingDetail } = useConversation(selectedConversationId);
    const { data: unreadCount } = useUnreadCount();
    const markAsRead = useMarkAsRead();

    // Derived state
    const conversations = listData?.conversations ?? [];
    const totalCount = listData?.total ?? 0;
    const hasConversations = conversations.length > 0 || isLoadingList;

    // Track which conversations we've already marked as read to prevent infinite loops
    const markedAsReadRef = useRef<Set<string>>(new Set());

    // Auto-mark as read when conversation is selected (only once per conversation)
    useEffect(() => {
        if (selectedConversationId && conversationDetail) {
            // Skip if already marked
            if (markedAsReadRef.current.has(selectedConversationId)) {
                return;
            }
            const hasUnread = conversationDetail.messages?.some(m => !m.isRead && m.direction === 'INBOUND');
            if (hasUnread) {
                markedAsReadRef.current.add(selectedConversationId);
                markAsRead.mutate(selectedConversationId);
            }
        }
    }, [selectedConversationId, conversationDetail]); // Removed markAsRead from deps

    // Handlers
    const handleSelectConversation = useCallback((conversation: ConversationWithProspect) => {
        setSelectedConversationId(conversation.id);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setSelectedConversationId(null);
    }, []);

    const handleFilterChange = useCallback((newFilters: Partial<ConversationFilters>) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters,
            page: 1, // Reset to first page on filter change
        }));
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    // Keyboard navigation
    const selectedIndex = conversations.findIndex(c => c.id === selectedConversationId);

    const handleNavigateUp = useCallback(() => {
        if (selectedIndex > 0) {
            setSelectedConversationId(conversations[selectedIndex - 1].id);
        }
    }, [selectedIndex, conversations]);

    const handleNavigateDown = useCallback(() => {
        if (selectedIndex < conversations.length - 1) {
            setSelectedConversationId(conversations[selectedIndex + 1].id);
        } else if (selectedIndex === -1 && conversations.length > 0) {
            setSelectedConversationId(conversations[0].id);
        }
    }, [selectedIndex, conversations]);

    useInboxKeyboardNav({
        onNavigateUp: handleNavigateUp,
        onNavigateDown: handleNavigateDown,
        onOpen: () => { }, // Already selected
        onClose: handleCloseDetail,
        enabled: hasConversations,
    });

    // Error state
    if (listError) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-red-600 mb-2">Erreur lors du chargement des conversations</p>
                    <p className="text-slate-500 text-sm">{listError.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
                        {typeof unreadCount === 'number' && unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                                {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500">
                        {totalCount} conversation{totalCount > 1 ? 's' : ''}
                    </p>
                </div>
                <InboxFilters filters={filters} onFilterChange={handleFilterChange} />
            </div>

            {/* Content */}
            <div className="flex-1 flex min-h-0">
                {isLoadingList ? (
                    <InboxSkeleton />
                ) : !hasConversations ? (
                    <InboxEmptyState />
                ) : (
                    <>
                        {/* Conversation List */}
                        <div className={`${selectedConversationId ? 'w-1/3' : 'w-full'} border-r border-slate-200 overflow-hidden transition-all duration-200`}>
                            <ConversationList
                                conversations={conversations}
                                selectedId={selectedConversationId}
                                onSelect={handleSelectConversation}
                                page={filters.page ?? 1}
                                limit={filters.limit ?? 25}
                                total={totalCount}
                                onPageChange={handlePageChange}
                            />
                        </div>

                        {/* Conversation Detail */}
                        {selectedConversationId && (
                            <div className="flex-1 overflow-hidden">
                                <ConversationDetail
                                    conversation={conversationDetail ?? null}
                                    isLoading={isLoadingDetail}
                                    onClose={handleCloseDetail}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
