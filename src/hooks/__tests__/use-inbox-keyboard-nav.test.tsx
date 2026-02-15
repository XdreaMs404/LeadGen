import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useInboxKeyboardNav } from '../use-inbox-keyboard-nav';

describe('useInboxKeyboardNav', () => {
    it('handles arrow, enter, escape and K shortcuts', () => {
        const onNavigateUp = vi.fn();
        const onNavigateDown = vi.fn();
        const onOpen = vi.fn();
        const onClose = vi.fn();
        const onMarkAsRead = vi.fn();

        renderHook(() =>
            useInboxKeyboardNav({
                onNavigateUp,
                onNavigateDown,
                onOpen,
                onClose,
                onMarkAsRead,
            })
        );

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

        expect(onNavigateUp).toHaveBeenCalledTimes(1);
        expect(onNavigateDown).toHaveBeenCalledTimes(1);
        expect(onOpen).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onMarkAsRead).toHaveBeenCalledTimes(1);
    });

    it('ignores events when typing inside input fields', () => {
        const onNavigateDown = vi.fn();
        const input = document.createElement('input');
        document.body.appendChild(input);

        renderHook(() =>
            useInboxKeyboardNav({
                onNavigateUp: vi.fn(),
                onNavigateDown,
                onOpen: vi.fn(),
                onClose: vi.fn(),
            })
        );

        const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
        Object.defineProperty(event, 'target', { value: input });
        window.dispatchEvent(event);

        expect(onNavigateDown).not.toHaveBeenCalled();
        document.body.removeChild(input);
    });
});
