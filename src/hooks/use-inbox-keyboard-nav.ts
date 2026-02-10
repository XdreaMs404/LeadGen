'use client';

/**
 * Inbox Keyboard Navigation Hook (Story 6.3 AC6)
 * 
 * Provides keyboard navigation for the inbox:
 * - Arrow up/down: Navigate list
 * - Enter: Open conversation
 * - Escape: Close detail panel
 * - K: Mark current as read
 */

import { useEffect, useCallback } from 'react';

interface UseInboxKeyboardNavOptions {
    onNavigateUp: () => void;
    onNavigateDown: () => void;
    onOpen: () => void;
    onClose: () => void;
    onMarkAsRead?: () => void;
    enabled?: boolean;
}

export function useInboxKeyboardNav({
    onNavigateUp,
    onNavigateDown,
    onOpen,
    onClose,
    onMarkAsRead,
    enabled = true,
}: UseInboxKeyboardNavOptions) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't handle if user is typing in an input/textarea
        if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement ||
            e.target instanceof HTMLSelectElement
        ) {
            return;
        }

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                onNavigateUp();
                break;
            case 'ArrowDown':
                e.preventDefault();
                onNavigateDown();
                break;
            case 'Enter':
                e.preventDefault();
                onOpen();
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
            case 'k':
            case 'K':
                if (!e.metaKey && !e.ctrlKey && onMarkAsRead) {
                    e.preventDefault();
                    onMarkAsRead();
                }
                break;
        }
    }, [onNavigateUp, onNavigateDown, onOpen, onClose, onMarkAsRead]);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, handleKeyDown]);
}
