/**
 * Variable Picker Component Tests
 * Tests for VariablePicker popover component.
 *
 * @module __tests__/unit/sequences/variable-picker.test
 * @story 4.3 Template Variables System with Picker
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VariablePicker } from '@/components/features/sequences/VariablePicker';
import { TEMPLATE_VARIABLES } from '@/lib/constants/template-variables';

describe('VariablePicker', () => {
    const mockOnInsert = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the Variables button', () => {
        render(<VariablePicker onInsert={mockOnInsert} />);

        expect(screen.getByText('Variables')).toBeInTheDocument();
    });

    it('should show popover when clicked', async () => {
        render(<VariablePicker onInsert={mockOnInsert} />);

        const button = screen.getByRole('button', { name: /insérer une variable/i });
        fireEvent.click(button);

        // Check that the popover content appears with the "Cliquez pour insérer" text
        expect(await screen.findByText('Cliquez pour insérer')).toBeInTheDocument();
    });

    it('should display all template variables', async () => {
        render(<VariablePicker onInsert={mockOnInsert} />);

        const button = screen.getByRole('button', { name: /insérer une variable/i });
        fireEvent.click(button);

        // Check that all variables are rendered
        for (const variable of TEMPLATE_VARIABLES) {
            expect(await screen.findByText(`{{${variable.name}}}`)).toBeInTheDocument();
            expect(await screen.findByText(variable.label)).toBeInTheDocument();
        }
    });

    it('should call onInsert with formatted variable when clicked', async () => {
        render(<VariablePicker onInsert={mockOnInsert} />);

        const triggerButton = screen.getByRole('button', { name: /insérer une variable/i });
        fireEvent.click(triggerButton);

        // Click on first_name variable
        const firstNameButton = await screen.findByText('{{first_name}}');
        fireEvent.click(firstNameButton.closest('button')!);

        expect(mockOnInsert).toHaveBeenCalledWith('{{first_name}}');
        expect(mockOnInsert).toHaveBeenCalledTimes(1);
    });

    it('should close popover after selection', async () => {
        render(<VariablePicker onInsert={mockOnInsert} />);

        const triggerButton = screen.getByRole('button', { name: /insérer une variable/i });
        fireEvent.click(triggerButton);

        // Wait for popover to open
        const firstNameButton = await screen.findByText('{{first_name}}');
        fireEvent.click(firstNameButton.closest('button')!);

        // Popover should close after selection
        expect(screen.queryByText('Cliquez pour insérer')).not.toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
        render(<VariablePicker onInsert={mockOnInsert} disabled={true} />);

        const button = screen.getByRole('button', { name: /insérer une variable/i });
        expect(button).toBeDisabled();
    });

    it('should have proper accessibility attributes', () => {
        render(<VariablePicker onInsert={mockOnInsert} />);

        const button = screen.getByRole('button', { name: /insérer une variable/i });
        expect(button).toHaveAttribute('aria-label', expect.stringContaining('variable'));
    });
});
