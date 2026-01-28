/**
 * ProspectFilters Component Tests
 * Story 3.4: Prospect List & Status Display with Filters
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProspectFilters } from '@/components/features/prospects/ProspectFilters';

describe('ProspectFilters', () => {
    const defaultProps = {
        search: '',
        status: [],
        source: [],
        fromDate: undefined,
        toDate: undefined,
        onSearchChange: vi.fn(),
        onStatusChange: vi.fn(),
        onSourceChange: vi.fn(),
        onDateRangeChange: vi.fn(),
        onReset: vi.fn(),
    };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('renders search input', () => {
        render(<ProspectFilters {...defaultProps} />);
        expect(screen.getByPlaceholderText(/rechercher par nom/i)).toBeInTheDocument();
    });

    it('renders filter button', () => {
        render(<ProspectFilters {...defaultProps} />);
        expect(screen.getByRole('button', { name: /filtres/i })).toBeInTheDocument();
    });

    it('renders quick filter buttons', () => {
        render(<ProspectFilters {...defaultProps} />);
        expect(screen.getByRole('button', { name: /vérifiés/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /à réviser/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /nouveaux/i })).toBeInTheDocument();
    });

    it('debounces search input by 300ms', async () => {
        const mockOnSearchChange = vi.fn();
        render(<ProspectFilters {...defaultProps} onSearchChange={mockOnSearchChange} />);

        const searchInput = screen.getByPlaceholderText(/rechercher par nom/i);
        fireEvent.change(searchInput, { target: { value: 'test' } });

        // Should not be called immediately
        expect(mockOnSearchChange).not.toHaveBeenCalled();

        // Fast-forward 300ms
        vi.advanceTimersByTime(300);

        // Now should be called
        expect(mockOnSearchChange).toHaveBeenCalledWith('test');
    });

    it('cancels previous debounce when value changes', () => {
        const mockOnSearchChange = vi.fn();
        render(<ProspectFilters {...defaultProps} onSearchChange={mockOnSearchChange} />);

        const searchInput = screen.getByPlaceholderText(/rechercher par nom/i);

        // Type first value
        fireEvent.change(searchInput, { target: { value: 'test' } });
        vi.advanceTimersByTime(100);

        // Type second value before debounce fires
        fireEvent.change(searchInput, { target: { value: 'testing' } });
        vi.advanceTimersByTime(300);

        // Should only be called with final value
        expect(mockOnSearchChange).toHaveBeenCalledTimes(1);
        expect(mockOnSearchChange).toHaveBeenCalledWith('testing');
    });

    it('applies quick filter when clicked', () => {
        render(<ProspectFilters {...defaultProps} />);

        const verifiedButton = screen.getByRole('button', { name: /vérifiés/i });
        fireEvent.click(verifiedButton);

        expect(defaultProps.onStatusChange).toHaveBeenCalledWith(['VERIFIED']);
    });

    it('shows active filter count badge when filters active', () => {
        render(<ProspectFilters {...defaultProps} status={['NEW', 'VERIFIED']} />);

        // Should show badge with count
        const badge = screen.getByText('1');
        expect(badge).toBeInTheDocument();
    });
});
