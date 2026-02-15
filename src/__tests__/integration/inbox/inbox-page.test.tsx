import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InboxPageClient } from '@/components/features/inbox/InboxPageClient';
import type { ConversationListItem, ConversationWithMessages } from '@/types/inbox';

const mockUseConversations = vi.fn();
const mockUseConversation = vi.fn();
const mockUseMarkAsRead = vi.fn();
const mockUseUnreadCount = vi.fn();
const mutate = vi.fn();

vi.mock('@/hooks/use-conversations', () => ({
    useConversations: (...args: unknown[]) => mockUseConversations(...args),
    useInboxConversations: (...args: unknown[]) => mockUseConversations(...args),
    useConversation: (...args: unknown[]) => mockUseConversation(...args),
    useMarkAsRead: () => mockUseMarkAsRead(),
    useUnreadCount: () => mockUseUnreadCount(),
}));

vi.mock('@/hooks/use-inbox-keyboard-nav', () => ({
    useInboxKeyboardNav: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: vi.fn() }),
    usePathname: () => '/inbox',
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/features/inbox/ConversationDetail', () => ({
    ConversationDetail: ({ conversation }: { conversation: ConversationWithMessages | null }) => (
        <div>{conversation ? `detail:${conversation.id}` : 'detail:none'}</div>
    ),
}));

describe('Inbox page integration', () => {
    const listItem: ConversationListItem = {
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
            name: 'Q1',
        },
        unreadCount: 0,
        lastMessage: {
            id: 'msg-1',
            conversationId: 'conv-1',
            gmailMessageId: 'gmail-1',
            direction: 'INBOUND',
            subject: 'Re: Demo',
            bodyRaw: 'hello',
            bodyCleaned: 'hello',
            fromEmail: 'john@example.com',
            toEmail: 'sales@example.com',
            receivedAt: new Date().toISOString(),
            classification: 'INTERESTED',
            confidenceScore: 88,
            classificationMethod: 'LLM',
            needsReview: false,
            isRead: true,
            createdAt: new Date().toISOString(),
        },
    };

    const detail: ConversationWithMessages = {
        ...listItem,
        messages: [listItem.lastMessage!],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseMarkAsRead.mockReturnValue({ mutate });
        mockUseUnreadCount.mockReturnValue({ data: 0 });
    });

    it('shows empty state when there are no conversations', () => {
        mockUseConversations.mockReturnValue({
            data: { conversations: [], total: 0, page: 1, limit: 25, unreadTotal: 0 },
            isLoading: false,
            error: null,
        });
        mockUseConversation.mockReturnValue({ data: null, isLoading: false });

        render(<InboxPageClient />);

        expect(screen.getByText('Inbox')).toBeInTheDocument();
        expect(screen.getByText(/No replies yet/i)).toBeInTheDocument();
    });

    it('opens conversation detail when selecting a row', () => {
        mockUseConversations.mockReturnValue({
            data: { conversations: [listItem], total: 1, page: 1, limit: 25, unreadTotal: 0 },
            isLoading: false,
            error: null,
        });
        mockUseConversation.mockImplementation((id: string | null) => ({
            data: id ? detail : null,
            isLoading: false,
        }));

        render(<InboxPageClient />);

        fireEvent.click(screen.getByRole('button', { name: /john doe/i }));

        expect(screen.getByText('detail:conv-1')).toBeInTheDocument();
    });
});
