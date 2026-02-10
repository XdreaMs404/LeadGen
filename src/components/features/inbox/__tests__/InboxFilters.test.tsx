
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InboxFilters } from '../InboxFilters';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ConversationFilters } from '@/hooks/use-conversations';

// Mock dependencies
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

    it('should render search input', () => {
        render(<InboxFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />);
        expect(screen.getByPlaceholderText('Rechercher un prospect...')).toBeInTheDocument();
    });

    it('should call onFilterChange when searching (debounced)', async () => {
        render(<InboxFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

        const input = screen.getByPlaceholderText('Rechercher un prospect...');
        fireEvent.change(input, { target: { value: 'John' } });

        // Should not be called immediately
        expect(mockOnFilterChange).not.toHaveBeenCalled();

        // Wait for debounce
        await waitFor(() => {
            expect(mockOnFilterChange).toHaveBeenCalledWith({ search: 'John' });
        }, { timeout: 500 });
    });

    it('should toggle unread filter', () => {
        render(<InboxFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

        const unreadButtons = screen.getAllByText('Non lus');
        const unreadButton = unreadButtons[0]; // Main toggle is first
        fireEvent.click(unreadButton);

        expect(mockOnFilterChange).toHaveBeenCalledWith({ hasUnread: true });
    });

    it('should show clear button when active filters exist', () => {
        const activeFilters = { ...defaultFilters, hasUnread: true };
        render(<InboxFilters filters={activeFilters} onFilterChange={mockOnFilterChange} />);

        const clearButton = screen.getByText('Effacer');
        expect(clearButton).toBeInTheDocument();

        fireEvent.click(clearButton);
        expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
            hasUnread: undefined,
        }));
    });
});
