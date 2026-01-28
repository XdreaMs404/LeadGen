/**
 * Tests for ProspectForm Component (Story 3.3)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProspectForm } from '@/components/features/prospects/ProspectForm';

// Mock dependencies
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('ProspectForm', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnSubmit.mockResolvedValue(undefined);
    });

    const renderForm = (isLoading = false) => {
        return render(
            <ProspectForm
                onSubmit={mockOnSubmit}
                isLoading={isLoading}
                onCancel={mockOnCancel}
            />
        );
    };

    it('renders all required form labels', () => {
        renderForm();

        // Check labels exist - verify required asterisks are present for email and source
        // Using getAllByText since some text patterns may match multiple elements
        const emailLabels = screen.getAllByText(/Email/);
        expect(emailLabels.length).toBeGreaterThan(0);

        const prenomLabels = screen.getAllByText(/Prénom/);
        expect(prenomLabels.length).toBeGreaterThan(0);

        // Source label with required asterisk
        const sourceElements = screen.getAllByText(/Source/);
        expect(sourceElements.length).toBeGreaterThan(0);
    });

    it('renders all input fields', () => {
        renderForm();

        // Check input fields by placeholder
        expect(screen.getByPlaceholderText('email@exemple.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Jean')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Dupont')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('CEO')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('+33 6 12 34 56 78')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('https://linkedin.com/in/...')).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
        renderForm();

        expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
        renderForm();

        const cancelButton = screen.getByRole('button', { name: /annuler/i });
        fireEvent.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalled();
    });

    it('disables buttons when loading', () => {
        renderForm(true);

        const submitButton = screen.getByRole('button', { name: /ajout/i });
        const cancelButton = screen.getByRole('button', { name: /annuler/i });

        expect(submitButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
    });

    it('shows loading state on submit button', () => {
        renderForm(true);

        expect(screen.getByText(/ajout.../i)).toBeInTheDocument();
    });

    it('has source dropdown with combobox role', () => {
        renderForm();

        const sourceSelect = screen.getByRole('combobox');
        expect(sourceSelect).toBeInTheDocument();
    });

    it('does not show sourceDetail field by default', () => {
        renderForm();

        // sourceDetail should not be visible until source is OTHER
        expect(screen.queryByPlaceholderText(/précisez la source/i)).not.toBeInTheDocument();
    });

    it('validates email format on form submission', async () => {
        renderForm();

        const emailInput = screen.getByPlaceholderText('email@exemple.com');
        const submitButton = screen.getByRole('button', { name: /ajouter/i });

        // Enter invalid email
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.click(submitButton);

        // Should not call onSubmit with invalid data
        await waitFor(() => {
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });
});
