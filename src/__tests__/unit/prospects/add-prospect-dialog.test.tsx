/**
 * Tests for AddProspectDialog Component (Story 3.3)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddProspectDialog } from '@/components/features/prospects/AddProspectDialog';
import { DuplicateProspectError } from '@/hooks/use-prospects';

// Mock dependencies
const mockMutateAsync = vi.fn();

// Handle both standard and duplicate error cases
const mockCreateProspect = {
    mutateAsync: mockMutateAsync,
    isPending: false,
};

vi.mock('@/hooks/use-prospects', () => ({
    useCreateProspect: () => mockCreateProspect,
    DuplicateProspectError: class extends Error {
        constructor(message: string, public prospectId?: string) {
            super(message);
            this.name = 'DuplicateProspectError';
        }
    },
}));

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

// Mock toast
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
    toast: {
        error: (content: any) => mockToastError(content),
    },
}));

describe('AddProspectDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMutateAsync.mockResolvedValue({});
    });

    it('opens dialog when trigger button is clicked', () => {
        render(<AddProspectDialog />);

        const triggerButton = screen.getByRole('button', { name: /ajouter un prospect/i });
        fireEvent.click(triggerButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Nouveau contact')).toBeInTheDocument();
    });

    it('renders default trigger if none provided', () => {
        render(<AddProspectDialog />);
        expect(screen.getByRole('button', { name: /ajouter un prospect/i })).toBeInTheDocument();
    });

    it('renders custom trigger if provided', () => {
        render(<AddProspectDialog trigger={<button>Custom Trigger</button>} />);
        expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /ajouter un prospect/i })).not.toBeInTheDocument();
    });

    it('closes dialog on successful submission', async () => {
        render(<AddProspectDialog />);

        // Open dialog
        fireEvent.click(screen.getByRole('button', { name: /ajouter un prospect/i }));

        // Fill form basics (ProspectForm is already tested, just need to trigger submit)
        const emailInput = screen.getByPlaceholderText('email@exemple.com');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const submitButton = screen.getByRole('button', { name: /ajouter le prospect/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalled();
        });

        // Dialog should be closed (removed from DOM)
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    it('handles duplicate prospect error with toast link', async () => {
        const error = new DuplicateProspectError('Ce prospect existe déjà', 'prospect-123');
        mockMutateAsync.mockRejectedValueOnce(error);

        render(<AddProspectDialog />);

        // Open and submit
        fireEvent.click(screen.getByRole('button', { name: /ajouter un prospect/i }));

        const emailInput = screen.getByPlaceholderText('email@exemple.com');
        fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });

        fireEvent.click(screen.getByRole('button', { name: /ajouter le prospect/i }));

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalled();
        });

        // Verify toast content (React Node) was passed
        // We can't easily assert the React Node content, but we verify error was called
        // and dialog can potentially remain open for correction
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});
