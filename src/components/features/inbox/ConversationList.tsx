'use client';

/**
 * Conversation List Component (Story 6.3 AC2, AC8)
 * 
 * Displays a list of conversations with:
 * - Prospect name/email, subject, preview, timestamp
 * - Classification badge
 * - Unread indicator
 * - Pagination controls
 */

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ClassificationBadge } from './ClassificationBadge';
import type { ConversationWithProspect, InboxMessage } from '@/types/inbox';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Extended type to include lastMessage and unreadCount
interface ConversationListItem extends ConversationWithProspect {
    messages?: InboxMessage[];
    _count?: {
        messages: number;
    };
}

interface ConversationListProps {
    conversations: ConversationListItem[];
    selectedId: string | null;
    onSelect: (conversation: ConversationListItem) => void;
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
}

function getProspectDisplayName(prospect: ConversationListItem['prospect']): string {
    if (!prospect) return 'Inconnu';
    if (prospect.firstName || prospect.lastName) {
        return [prospect.firstName, prospect.lastName].filter(Boolean).join(' ');
    }
    return prospect.email;
}

function getMessagePreview(message: InboxMessage | undefined): string {
    if (!message) return 'Aucun message';
    const text = message.bodyCleaned || message.bodyRaw || '';
    // Clean and truncate
    const cleaned = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.length > 100 ? cleaned.slice(0, 100) + '...' : cleaned;
}

export function ConversationList({
    conversations,
    selectedId,
    onSelect,
    page,
    limit,
    total,
    onPageChange,
}: ConversationListProps) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return (
        <div className="flex flex-col h-full">
            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {conversations.map((conversation) => {
                    const isSelected = conversation.id === selectedId;
                    const lastMessage = conversation.messages?.[0];
                    const unreadCount = conversation._count?.messages ?? 0;
                    const hasUnread = unreadCount > 0;

                    return (
                        <button
                            key={conversation.id}
                            onClick={() => onSelect(conversation)}
                            className={cn(
                                "w-full text-left p-4 transition-colors hover:bg-slate-50 focus:outline-none focus:bg-slate-50",
                                isSelected && "bg-teal-50 hover:bg-teal-50",
                                hasUnread && "bg-slate-50/50"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium",
                                    isSelected
                                        ? "bg-teal-500 text-white"
                                        : "bg-slate-200 text-slate-600"
                                )}>
                                    {getProspectDisplayName(conversation.prospect).charAt(0).toUpperCase()}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <span className={cn(
                                            "truncate text-sm",
                                            hasUnread ? "font-semibold text-slate-900" : "font-medium text-slate-700"
                                        )}>
                                            {getProspectDisplayName(conversation.prospect)}
                                        </span>
                                        <span className="text-xs text-slate-500 flex-shrink-0">
                                            {lastMessage ? formatDistanceToNow(new Date(lastMessage.receivedAt), {
                                                addSuffix: false,
                                                locale: fr,
                                            }) : '—'}
                                        </span>
                                    </div>

                                    {/* Subject */}
                                    <p className={cn(
                                        "text-sm truncate mb-1",
                                        hasUnread ? "font-medium text-slate-800" : "text-slate-600"
                                    )}>
                                        {lastMessage?.subject || 'Sans objet'}
                                    </p>

                                    {/* Preview */}
                                    <p className="text-xs text-slate-500 line-clamp-2">
                                        {getMessagePreview(lastMessage)}
                                    </p>
                                </div>

                                {/* Right side: badge + unread indicator */}
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    {lastMessage?.classification && (
                                        <ClassificationBadge
                                            classification={lastMessage.classification}
                                            size="sm"
                                        />
                                    )}
                                    {hasUnread && (
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-white text-xs font-medium">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Campaign info */}
                            {conversation.campaign && (
                                <div className="mt-2 ml-13">
                                    <span className="text-xs text-slate-400">
                                        {conversation.campaign.name}
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex-shrink-0 border-t border-slate-200 px-4 py-3 bg-white">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                            Page {page} sur {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(page - 1)}
                                disabled={!hasPrevPage}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
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
