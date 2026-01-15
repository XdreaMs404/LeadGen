'use client';

import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, Circle } from 'lucide-react';

export type StepStatus = 'not-checked' | 'pass' | 'fail' | 'unknown' | 'active';

export interface WizardStep {
    id: string;
    label: string;
    status: StepStatus;
}

interface WizardStepperProps {
    steps: WizardStep[];
    currentStepId: string;
    onStepClick?: (stepId: string) => void;
    className?: string;
}

function getStatusIcon(status: StepStatus, isActive: boolean) {
    if (isActive) {
        return (
            <Circle className="h-4 w-4 fill-current" data-testid="status-active" />
        );
    }

    switch (status) {
        case 'pass':
            return <Check className="h-4 w-4" data-testid="status-pass" />;
        case 'fail':
            return <X className="h-4 w-4" data-testid="status-fail" />;
        case 'unknown':
            return <AlertTriangle className="h-4 w-4" data-testid="status-unknown" />;
        default:
            return <Circle className="h-4 w-4" data-testid="status-not-checked" />;
    }
}

function getStatusColors(status: StepStatus, isActive: boolean): string {
    if (isActive) {
        return 'bg-teal-600 text-white border-teal-600';
    }

    switch (status) {
        case 'pass':
            return 'bg-green-100 text-green-700 border-green-300';
        case 'fail':
            return 'bg-red-100 text-red-700 border-red-300';
        case 'unknown':
            return 'bg-amber-100 text-amber-700 border-amber-300';
        default:
            return 'bg-gray-100 text-gray-500 border-gray-300';
    }
}

/**
 * WizardStepper - Reusable step-by-step navigation component
 * Displays progress through multi-step wizards with status badges
 */
export function WizardStepper({
    steps,
    currentStepId,
    onStepClick,
    className,
}: WizardStepperProps) {
    return (
        <nav
            aria-label="Étapes de configuration"
            className={cn('flex items-center justify-center gap-2', className)}
        >
            {steps.map((step, index) => {
                const isActive = step.id === currentStepId;
                const isClickable = onStepClick !== undefined;

                return (
                    <div key={step.id} className="flex items-center">
                        <button
                            type="button"
                            onClick={() => onStepClick?.(step.id)}
                            disabled={!isClickable}
                            className={cn(
                                'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border',
                                getStatusColors(step.status, isActive),
                                isClickable && 'cursor-pointer hover:opacity-80',
                                !isClickable && 'cursor-default'
                            )}
                            aria-current={isActive ? 'step' : undefined}
                            data-testid={`step-${step.id}`}
                        >
                            {getStatusIcon(step.status, isActive)}
                            <span className="hidden sm:inline">{step.label}</span>
                        </button>

                        {index < steps.length - 1 && (
                            <div className="w-6 sm:w-10 h-px bg-border mx-1 sm:mx-2" aria-hidden="true" />
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
