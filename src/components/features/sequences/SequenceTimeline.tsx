'use client';

import { Fragment } from 'react';
import type { SequenceStep } from '@/types/sequence';
import { cn } from '@/lib/utils';

interface SequenceTimelineProps {
    steps: SequenceStep[];
    className?: string;
}

/**
 * Visual timeline component showing sequence flow with delays
 * Story 4.2 - Task 4 (AC5)
 * Shows step markers connected by lines with day counts
 */
export function SequenceTimeline({ steps, className }: SequenceTimelineProps) {
    // Sort steps by order to ensure correct display
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

    // Calculate total duration (sum of all delays except first step)
    const totalDays = sortedSteps.reduce((sum, step, i) =>
        i === 0 ? 0 : sum + step.delayDays, 0
    );

    if (sortedSteps.length === 0) {
        return null;
    }

    return (
        <div className={cn(
            'flex items-center gap-1 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700',
            className
        )}>
            {sortedSteps.map((step, index) => (
                <Fragment key={step.id}>
                    {/* Step indicator */}
                    <div
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-sm font-semibold shadow-lg shadow-teal-500/20"
                        title={`Étape ${step.order}: ${step.subject || 'Sans objet'}`}
                    >
                        {step.order}
                    </div>

                    {/* Connector with delay */}
                    {index < sortedSteps.length - 1 && (
                        <div className="flex items-center">
                            {/* Line before */}
                            <div className="w-6 h-0.5 bg-gradient-to-r from-teal-400 to-teal-300 dark:from-teal-600 dark:to-teal-500" />
                            {/* Delay badge */}
                            <span className="px-2 py-0.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50 rounded-full whitespace-nowrap">
                                {sortedSteps[index + 1].delayDays}j
                            </span>
                            {/* Line after */}
                            <div className="w-6 h-0.5 bg-gradient-to-r from-teal-300 to-teal-400 dark:from-teal-500 dark:to-teal-600" />
                        </div>
                    )}
                </Fragment>
            ))}

            {/* Total duration */}
            {sortedSteps.length > 1 && (
                <div className="ml-4 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                    Total: {totalDays} jour{totalDays > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
