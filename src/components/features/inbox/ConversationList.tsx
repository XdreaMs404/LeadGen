'use client';

/**
 * Conversation List Component (Story 6.3 AC2, AC8)
 */

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ConversationListItem } from './ConversationListItem';
import type { ConversationListItem as ConversationListItemType } from '@/types/inbox';

interface ConversationListProps {
    conversations: ConversationListItemType[];
    selectedId: string | null;
    onSelect: (conversation: ConversationListItemType) => void;
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
}

export function ConversationList({
    conversations,
    selectedId,
    onSelect,
    page,
    limit,
    total,
    onPageChange,
    onLimitChange,
}: ConversationListProps) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {conversations.map((conversation) => (
                    <ConversationListItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={conversation.id === selectedId}
                        onSelect={onSelect}
                    />
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex-shrink-0 border-t border-slate-200 px-4 py-3 bg-white">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-600">
                            Page {page} sur {totalPages}
                        </span>

                        <div className="flex items-center gap-2">
                            <label htmlFor="inbox-page-size" className="text-xs text-slate-500">
                                Taille
                            </label>
                            <select
                                id="inbox-page-size"
                                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
                                value={limit}
                                onChange={(e) => onLimitChange?.(parseInt(e.target.value, 10))}
                            >
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                aria-label="Page précédente"
                                onClick={() => onPageChange(page - 1)}
                                disabled={!hasPrevPage}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                aria-label="Page suivante"
                                onClick={() => onPageChange(page + 1)}
                                disabled={!hasNextPage}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
