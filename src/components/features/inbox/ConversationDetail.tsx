'use client';

/**
 * Conversation Detail Component (Story 6.3 AC3, AC5)
 * 
 * Displays the full conversation thread with:
 * - Header with prospect info
 * - Message thread in chronological order
 * - Prospect info sidebar with campaign context
 */

import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageThread } from './MessageThread';
import { ProspectInfoSidebar } from './ProspectInfoSidebar';
import type { ConversationWithMessages } from '@/types/inbox';

interface ConversationDetailProps {
    conversation: ConversationWithMessages | null;
    isLoading: boolean;
    onClose: () => void;
}

export function ConversationDetail({ conversation, isLoading, onClose }: ConversationDetailProps) {
    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Chargement de la conversation...</p>
                </div>
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <p className="text-slate-500">Sélectionnez une conversation</p>
            </div>
        );
    }

    const prospectName = conversation.prospect
        ? [conversation.prospect.firstName, conversation.prospect.lastName].filter(Boolean).join(' ') || conversation.prospect.email
        : 'Inconnu';

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center font-medium">
                            {prospectName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">{prospectName}</h2>
                            {conversation.prospect?.email && prospectName !== conversation.prospect.email && (
                                <p className="text-sm text-slate-500">{conversation.prospect.email}</p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex min-h-0">
                {/* Thread */}
                <div className="flex-1 overflow-y-auto">
                    <MessageThread messages={conversation.messages} />
                </div>

                {/* Sidebar */}
                <div className="w-72 border-l border-slate-200 overflow-y-auto flex-shrink-0">
                    <ProspectInfoSidebar
                        prospect={conversation.prospect}
                        campaign={conversation.campaign}
                    />
                </div>
            </div>
        </div>
    );
}
