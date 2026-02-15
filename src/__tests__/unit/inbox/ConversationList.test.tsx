import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConversationList } from '@/components/features/inbox/ConversationList';
import type { ConversationListItem } from '@/types/inbox';

const baseConversation: ConversationListItem = {
    id: 'conv-1',
    threadId: 'thread-1',
    workspaceId: 'ws-1',
    prospectId: 'pros-1',
    campaignId: 'camp-1',
    sequenceId: null,
    status: 'OPEN',
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    prospect: {
        id: 'pros-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme',
    },
    campaign: {
        id: 'camp-1',
        name: 'Q1 Outreach',
    },
    lastMessage: {
        id: 'msg-1',
        conversationId: 'conv-1',
        gmailMessageId: 'gmail-1',
        direction: 'INBOUND',
        subject: 'Hello',
        bodyRaw: '<p>Interested</p>',
        bodyCleaned: 'Interested in your offer',
        fromEmail: 'john@example.com',
        toEmail: 'sales@example.com',
        receivedAt: new Date().toISOString(),
        classification: 'INTERESTED',
        isRead: false,
        createdAt: new Date().toISOString(),
    },
    unreadCount: 2,
};

describe('ConversationList', () => {
    it('renders conversations and handles selection', () => {
        const onSelect = vi.fn();
        render(
            <ConversationList
                conversations={[baseConversation]}
                selectedId={null}
                onSelect={onSelect}
                page={1}
                limit={25}
                total={1}
                onPageChange={vi.fn()}
            />
        );

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /john doe/i }));
        expect(onSelect).toHaveBeenCalledWith(baseConversation);
    });

    it('supports pagination and page size selection', () => {
        const onPageChange = vi.fn();
        const onLimitChange = vi.fn();

        render(
            <ConversationList
                conversations={[baseConversation]}
                selectedId={null}
                onSelect={vi.fn()}
                page={1}
                limit={25}
                total={60}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
            />
        );

        fireEvent.click(screen.getByLabelText('Page suivante'));
        expect(onPageChange).toHaveBeenCalledWith(2);

        fireEvent.change(screen.getByLabelText('Taille'), { target: { value: '50' } });
        expect(onLimitChange).toHaveBeenCalledWith(50);
    });
});
