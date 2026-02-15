import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InboxFilters } from '@/components/features/inbox/InboxFilters';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ConversationFilters } from '@/hooks/use-conversations';

vi.mock('lucide-react', () => ({
    Search: () => <div data-testid="search-icon" />,
    Filter: () => <div data-testid="filter-icon" />,
    X: () => <div data-testid="x-icon" />,
}));

describe('InboxFilters', () => {
    const mockOnFilterChange = vi.fn();
    const defaultFilters: ConversationFilters = {
        page: 1,
        limit: 25,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders search input', () => {
        render(<InboxFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />);
        expect(screen.getByPlaceholderText('Rechercher un prospect...')).toBeInTheDocument();
    });

    it('calls onFilterChange when searching (debounced)', async () => {
        render(<InboxFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

        const input = screen.getByPlaceholderText('Rechercher un prospect...');
        fireEvent.change(input, { target: { value: 'John' } });

        await waitFor(() => {
            expect(mockOnFilterChange).toHaveBeenCalledWith({ search: 'John' });
        }, { timeout: 500 });
    });

    it('toggles unread and needs review filters', () => {
        render(<InboxFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

        fireEvent.click(screen.getAllByText('Non lus')[0]);
        fireEvent.click(screen.getByText('À revoir'));

        expect(mockOnFilterChange).toHaveBeenCalledWith({ hasUnread: true });
        expect(mockOnFilterChange).toHaveBeenCalledWith({ needsReview: true });
    });

    it('applies date preset filter', () => {
        render(<InboxFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

        fireEvent.change(screen.getByLabelText('Date range'), { target: { value: '7d' } });

        expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
            dateFrom: expect.any(String),
            dateTo: expect.any(String),
        }));
    });

    it('clears all active filters', () => {
        const activeFilters = {
            ...defaultFilters,
            hasUnread: true,
            needsReview: true,
            dateFrom: '2026-02-01',
        };
        render(<InboxFilters filters={activeFilters} onFilterChange={mockOnFilterChange} />);

        fireEvent.click(screen.getByText('Effacer'));
        expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
            hasUnread: undefined,
            needsReview: undefined,
            classification: undefined,
            search: undefined,
            dateFrom: undefined,
            dateTo: undefined,
        }));
    });
});
