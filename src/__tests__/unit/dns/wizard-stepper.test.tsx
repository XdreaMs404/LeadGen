import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WizardStepper, type WizardStep } from '@/components/shared/WizardStepper';

describe('WizardStepper', () => {
    const mockSteps: WizardStep[] = [
        { id: 'step1', label: 'Step 1', status: 'not-checked' },
        { id: 'step2', label: 'Step 2', status: 'pass' },
        { id: 'step3', label: 'Step 3', status: 'fail' },
        { id: 'step4', label: 'Step 4', status: 'unknown' },
    ];

    it('should render all steps', () => {
        render(<WizardStepper steps={mockSteps} currentStepId="step1" />);

        expect(screen.getByTestId('step-step1')).toBeInTheDocument();
        expect(screen.getByTestId('step-step2')).toBeInTheDocument();
        expect(screen.getByTestId('step-step3')).toBeInTheDocument();
        expect(screen.getByTestId('step-step4')).toBeInTheDocument();
    });

    it('should show active status for current step', () => {
        render(<WizardStepper steps={mockSteps} currentStepId="step1" />);

        const step1 = screen.getByTestId('step-step1');
        expect(step1).toHaveAttribute('aria-current', 'step');
    });

    it('should show pass icon for passed step', () => {
        render(<WizardStepper steps={mockSteps} currentStepId="step1" />);

        expect(screen.getByTestId('status-pass')).toBeInTheDocument();
    });

    it('should show fail icon for failed step', () => {
        render(<WizardStepper steps={mockSteps} currentStepId="step1" />);

        expect(screen.getByTestId('status-fail')).toBeInTheDocument();
    });

    it('should show unknown icon for unknown status', () => {
        render(<WizardStepper steps={mockSteps} currentStepId="step1" />);

        expect(screen.getByTestId('status-unknown')).toBeInTheDocument();
    });

    it('should call onStepClick when step is clicked', () => {
        const handleClick = vi.fn();
        render(
            <WizardStepper
                steps={mockSteps}
                currentStepId="step1"
                onStepClick={handleClick}
            />
        );

        fireEvent.click(screen.getByTestId('step-step2'));
        expect(handleClick).toHaveBeenCalledWith('step2');
    });

    it('should not throw when onStepClick is not provided', () => {
        render(<WizardStepper steps={mockSteps} currentStepId="step1" />);

        // Should not throw
        fireEvent.click(screen.getByTestId('step-step2'));
    });

    it('should have accessible navigation role', () => {
        render(<WizardStepper steps={mockSteps} currentStepId="step1" />);

        expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
});
