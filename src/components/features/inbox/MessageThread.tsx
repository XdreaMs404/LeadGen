'use client';

/**
 * Message Thread Component (Story 6.3 AC3)
 * 
 * Displays all messages in a conversation in chronological order.
 * - INBOUND messages: left-aligned, gray background
 * - OUTBOUND messages: right-aligned, teal background
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ClassificationBadge } from './ClassificationBadge';
import type { InboxMessage } from '@/types/inbox';

interface MessageThreadProps {
    messages: InboxMessage[];
}

function formatMessageBody(message: InboxMessage): string {
    // Use cleaned body if available, otherwise raw
    const body = message.bodyCleaned || message.bodyRaw || '';

    // Convert newlines to <br> for HTML display
    // Also handle common email formatting
    return body
        .replace(/\n/g, '<br />')
        .replace(/\r/g, '');
}

export function MessageThread({ messages }: MessageThreadProps) {
    if (messages.length === 0) {
        return (
            <div className="p-6 text-center text-slate-500">
                <p>Aucun message dans cette conversation</p>
            </div>
        );
    }

    // Sort by receivedAt ascending (chronological)
    const sortedMessages = [...messages].sort(
        (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
    );

    return (
        <div className="p-4 space-y-4">
            {sortedMessages.map((message) => {
                const isInbound = message.direction === 'INBOUND';
                const formattedDate = format(
                    new Date(message.receivedAt),
                    "d MMM yyyy 'à' HH:mm",
                    { locale: fr }
                );

                return (
                    <div
                        key={message.id}
                        className={cn(
                            "flex",
                            isInbound ? "justify-start" : "justify-end"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-3",
                                isInbound
                                    ? "bg-slate-100 text-slate-800 rounded-bl-md"
                                    : "bg-teal-500 text-white rounded-br-md"
                            )}
                        >
                            {/* Subject (if different from previous) */}
                            {message.subject && (
                                <p className={cn(
                                    "font-medium text-sm mb-2 pb-2 border-b",
                                    isInbound
                                        ? "border-slate-200 text-slate-700"
                                        : "border-teal-400 text-white/90"
                                )}>
                                    {message.subject}
                                </p>
                            )}

                            {/* Body */}
                            <div
                                className={cn(
                                    "text-sm leading-relaxed",
                                    isInbound ? "text-slate-700" : "text-white"
                                )}
                                dangerouslySetInnerHTML={{ __html: formatMessageBody(message) }}
                            />

                            {/* Footer with timestamp and classification */}
                            <div className={cn(
                                "flex items-center justify-between gap-3 mt-3 pt-2 border-t",
                                isInbound
                                    ? "border-slate-200 text-slate-500"
                                    : "border-teal-400 text-white/70"
                            )}>
                                <span className="text-xs">
                                    {formattedDate}
                                </span>
                                {isInbound && message.classification && (
                                    <ClassificationBadge
                                        classification={message.classification}
                                        size="sm"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
