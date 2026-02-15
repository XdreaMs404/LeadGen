'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ClassificationBadge } from './ClassificationBadge';
import type { ConversationListItem as ConversationListItemType } from '@/types/inbox';

interface ConversationListItemProps {
    conversation: ConversationListItemType;
    isSelected: boolean;
    onSelect: (conversation: ConversationListItemType) => void;
}

function getProspectDisplayName(prospect: ConversationListItemType['prospect']): string {
    if (!prospect) return 'Inconnu';
    if (prospect.firstName || prospect.lastName) {
        return [prospect.firstName, prospect.lastName].filter(Boolean).join(' ');
    }
    return prospect.email;
}

function getMessagePreview(message: ConversationListItemType['lastMessage']): string {
    if (!message) return 'Aucun message';
    const text = message.bodyCleaned || message.bodyRaw || '';
    const cleaned = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.length > 50 ? cleaned.slice(0, 50) + '...' : cleaned;
}

export function ConversationListItem({ conversation, isSelected, onSelect }: ConversationListItemProps) {
    const lastMessage = conversation.lastMessage;
    const unreadCount = conversation.unreadCount ?? 0;
    const hasUnread = unreadCount > 0;

    return (
        <button
            type="button"
            onClick={() => onSelect(conversation)}
            className={cn(
                "w-full text-left p-4 transition-colors hover:bg-slate-50 focus:outline-none focus:bg-slate-50",
                isSelected && "bg-teal-50 hover:bg-teal-50",
                hasUnread && "bg-slate-50/50"
            )}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium",
                        isSelected
                            ? "bg-teal-500 text-white"
                            : "bg-slate-200 text-slate-600"
                    )}
                >
                    {getProspectDisplayName(conversation.prospect).charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span
                            className={cn(
                                "truncate text-sm",
                                hasUnread ? "font-semibold text-slate-900" : "font-medium text-slate-700"
                            )}
                        >
                            {getProspectDisplayName(conversation.prospect)}
                        </span>
                        <span className="text-xs text-slate-500 flex-shrink-0">
                            {lastMessage ? formatDistanceToNow(new Date(lastMessage.receivedAt), {
                                addSuffix: false,
                                locale: fr,
                            }) : '—'}
                        </span>
                    </div>

                    <p
                        className={cn(
                            "text-sm truncate mb-1",
                            hasUnread ? "font-medium text-slate-800" : "text-slate-600"
                        )}
                    >
                        {lastMessage?.subject || 'Sans objet'}
                    </p>

                    <p className="text-xs text-slate-500 line-clamp-2">{getMessagePreview(lastMessage)}</p>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <ClassificationBadge
                        classification={lastMessage?.classification ?? null}
                        confidenceScore={lastMessage?.confidenceScore ?? undefined}
                        size="sm"
                    />
                    {hasUnread && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-white text-xs font-medium">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>

            {conversation.campaign && (
                <div className="mt-2 ml-13">
                    <span className="text-xs text-slate-400">{conversation.campaign.name}</span>
                </div>
            )}
        </button>
    );
}
