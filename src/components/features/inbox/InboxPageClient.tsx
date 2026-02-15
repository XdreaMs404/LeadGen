'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    useInboxConversations,
    useConversation,
    useMarkAsRead,
    useUnreadCount,
    type ConversationFilters,
} from '@/hooks/use-conversations';
import { ConversationList } from '@/components/features/inbox/ConversationList';
import { ConversationDetail } from '@/components/features/inbox/ConversationDetail';
import { InboxFilters } from '@/components/features/inbox/InboxFilters';
import { InboxEmptyState } from '@/components/features/inbox/InboxEmptyState';
import { InboxSkeleton } from '@/components/features/inbox/InboxSkeleton';
import { useInboxKeyboardNav } from '@/hooks/use-inbox-keyboard-nav';
import type { ConversationListItem } from '@/types/inbox';
import { ReplyClassification } from '@prisma/client';

function parseFiltersFromUrl(searchParams: URLSearchParams): ConversationFilters {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const classificationRaw = searchParams.get('classification');
    const classification = classificationRaw
        ? classificationRaw
            .split(',')
            .map((value) => value.trim())
            .filter((value) => Object.values(ReplyClassification).includes(value as ReplyClassification)) as ReplyClassification[]
        : undefined;

    return {
        page: Number.isNaN(page) ? 1 : Math.max(1, page),
        limit: Number.isNaN(limit) ? 25 : [25, 50, 100].includes(limit) ? limit : 25,
        hasUnread: searchParams.get('unread') === 'true' ? true : undefined,
        needsReview: searchParams.get('needsReview') === 'true' ? true : undefined,
        sortByPriority: searchParams.get('sortByPriority') === 'false' ? false : true,
        search: searchParams.get('search') || undefined,
        classification: classification && classification.length > 0 ? classification : undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
    };
}

export function InboxPageClient() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [filters, setFilters] = useState<ConversationFilters>(() =>
        parseFiltersFromUrl(new URLSearchParams(searchParams.toString()))
    );

    const { data: listData, isLoading: isLoadingList, error: listError } = useInboxConversations(filters);
    const { data: conversationDetail, isLoading: isLoadingDetail } = useConversation(selectedConversationId);
    const { data: unreadCount } = useUnreadCount();
    const markAsRead = useMarkAsRead();

    const conversations = listData?.conversations ?? [];
    const totalCount = listData?.total ?? 0;
    const hasConversations = conversations.length > 0 || isLoadingList;

    const markedAsReadRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.page && filters.page !== 1) params.set('page', filters.page.toString());
        if (filters.limit && filters.limit !== 25) params.set('limit', filters.limit.toString());
        if (filters.hasUnread) params.set('unread', 'true');
        if (filters.needsReview) params.set('needsReview', 'true');
        if (filters.sortByPriority === false) params.set('sortByPriority', 'false');
        if (filters.search?.trim()) params.set('search', filters.search.trim());
        if (filters.classification && filters.classification.length > 0) {
            params.set('classification', filters.classification.join(','));
        }
        if (filters.dateFrom) params.set('dateFrom', String(filters.dateFrom));
        if (filters.dateTo) params.set('dateTo', String(filters.dateTo));

        const query = params.toString();
        const currentQuery = searchParams.toString();
        if (query === currentQuery) {
            return;
        }
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [filters, pathname, router, searchParams]);

    useEffect(() => {
        if (!selectedConversationId || !conversationDetail) {
            return;
        }

        if (markedAsReadRef.current.has(selectedConversationId)) {
            return;
        }

        const hasUnread = conversationDetail.messages?.some(
            (message) => !message.isRead && message.direction === 'INBOUND'
        );
        if (hasUnread) {
            markedAsReadRef.current.add(selectedConversationId);
            markAsRead.mutate(selectedConversationId);
        }
    }, [selectedConversationId, conversationDetail, markAsRead]);

    const handleSelectConversation = useCallback((conversation: ConversationListItem) => {
        setSelectedConversationId(conversation.id);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setSelectedConversationId(null);
    }, []);

    const handleFilterChange = useCallback((newFilters: Partial<ConversationFilters>) => {
        setFilters((prev) => ({
            ...prev,
            ...newFilters,
            page: 1,
        }));
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setFilters((prev) => ({ ...prev, page }));
    }, []);

    const handleLimitChange = useCallback((limit: number) => {
        setFilters((prev) => ({ ...prev, limit, page: 1 }));
    }, []);

    const selectedIndex = conversations.findIndex((conversation) => conversation.id === selectedConversationId);

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

    const handleOpenSelected = useCallback(() => {
        if (!selectedConversationId && conversations.length > 0) {
            setSelectedConversationId(conversations[0].id);
        }
    }, [selectedConversationId, conversations]);

    const handleMarkAsRead = useCallback(() => {
        if (!selectedConversationId) {
            return;
        }
        markedAsReadRef.current.add(selectedConversationId);
        markAsRead.mutate(selectedConversationId);
    }, [selectedConversationId, markAsRead]);

    useInboxKeyboardNav({
        onNavigateUp: handleNavigateUp,
        onNavigateDown: handleNavigateDown,
        onOpen: handleOpenSelected,
        onClose: handleCloseDetail,
        onMarkAsRead: handleMarkAsRead,
        enabled: hasConversations,
    });

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

            <div className="flex-1 flex min-h-0">
                {isLoadingList ? (
                    <InboxSkeleton />
                ) : !hasConversations ? (
                    <InboxEmptyState />
                ) : (
                    <>
                        <div className={`${selectedConversationId ? 'w-1/3' : 'w-full'} border-r border-slate-200 overflow-hidden transition-all duration-200`}>
                            <ConversationList
                                conversations={conversations}
                                selectedId={selectedConversationId}
                                onSelect={handleSelectConversation}
                                page={filters.page ?? 1}
                                limit={filters.limit ?? 25}
                                total={totalCount}
                                onPageChange={handlePageChange}
                                onLimitChange={handleLimitChange}
                            />
                        </div>

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
