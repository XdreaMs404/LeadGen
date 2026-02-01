'use client';

/**
 * usePreviewModal Hook
 * Story 4.5: Copilot Email Preview (Mandatory)
 * Story 4.6: Spam Risk Assessment & Warnings (MVP Heuristics)
 * Task 5: Create usePreviewModal Hook
 * Task 8: Update usePreviewModal Hook for spam analysis
 *
 * Manages state for the Copilot preview modal:
 * - Open/close state
 * - Current prospect/step indices
 * - Navigation between samples and steps
 * - Warning tracking (variables + spam)
 */

import { useState, useCallback, useMemo } from 'react';
import type { SequenceStep } from '@/types/sequence';
import type { PreviewProspect, PreviewRenderResult } from '@/lib/sequences/preview-renderer';
import { renderEmailPreview } from '@/lib/sequences/preview-renderer';
import { analyzeSpamRisk, SpamRiskLevel, type SpamAnalysisResult } from '@/lib/sequences/spam-analyzer';

export interface PreviewWarning {
    stepId: string;
    stepNumber: number;
    prospectIndex: number;
    missingVariables: string[];
}

export interface StepPreview {
    stepId: string;
    stepNumber: number;
    delayDays: number;
    subject: PreviewRenderResult;
    body: PreviewRenderResult;
    /** Story 4.6: Spam analysis result for this step */
    spamAnalysis: SpamAnalysisResult;
}

export interface UsePreviewModalResult {
    // State
    isOpen: boolean;
    currentProspectIndex: number;
    currentStepIndex: number;

    // Computed
    currentProspect: PreviewProspect | null;
    currentStepPreviews: StepPreview[];
    totalWarnings: number;
    warningDetails: PreviewWarning[];
    /** Story 4.6: Total spam warnings across all steps */
    totalSpamWarnings: number;
    /** Story 4.6: True if any step has HIGH spam risk */
    hasHighSpamRisk: boolean;

    // Methods
    open: () => void;
    close: () => void;
    nextProspect: () => void;
    prevProspect: () => void;
    goToStep: (stepIndex: number) => void;
    goToProspect: (prospectIndex: number) => void;

    // Helpers
    hasNextProspect: boolean;
    hasPrevProspect: boolean;
    prospectCount: number;
    stepCount: number;
}

interface UsePreviewModalOptions {
    steps: SequenceStep[];
    prospects: PreviewProspect[];
}

/**
 * Hook for managing Copilot Preview Modal state
 */
export function usePreviewModal({
    steps,
    prospects,
}: UsePreviewModalOptions): UsePreviewModalResult {
    const [isOpen, setIsOpen] = useState(false);
    const [currentProspectIndex, setCurrentProspectIndex] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Current prospect
    const currentProspect = prospects[currentProspectIndex] || null;

    // Compute previews for all steps with current prospect
    // Story 4.6: Now includes spam analysis
    const currentStepPreviews = useMemo((): StepPreview[] => {
        if (!currentProspect || steps.length === 0) return [];

        return steps
            .sort((a, b) => a.order - b.order)
            .map((step, index) => {
                const result = renderEmailPreview(step.subject, step.body, currentProspect);
                // Story 4.6: Analyze spam risk for this step
                const spamAnalysis = analyzeSpamRisk(
                    result.subject.rendered,
                    result.body.rendered
                );
                return {
                    stepId: step.id,
                    stepNumber: index + 1,
                    delayDays: step.delayDays,
                    subject: result.subject,
                    body: result.body,
                    spamAnalysis,
                };
            });
    }, [steps, currentProspect]);

    // Compute all warnings across all prospects and steps
    const { totalWarnings, warningDetails } = useMemo(() => {
        const warnings: PreviewWarning[] = [];
        let total = 0;

        prospects.forEach((prospect, prospectIndex) => {
            steps.forEach((step, stepIndex) => {
                const result = renderEmailPreview(step.subject, step.body, prospect);
                if (result.totalMissingVariables.length > 0) {
                    warnings.push({
                        stepId: step.id,
                        stepNumber: stepIndex + 1,
                        prospectIndex,
                        missingVariables: result.totalMissingVariables,
                    });
                    total += result.totalMissingVariables.length;
                }
            });
        });

        return { totalWarnings: total, warningDetails: warnings };
    }, [steps, prospects]);

    // Story 4.6: Compute spam warnings and high risk flag
    // Use the rendered results from currentStepPreviews to avoid double calculation
    // and ensuring we analyze the actual content (not raw templates)
    const { totalSpamWarnings, hasHighSpamRisk } = useMemo(() => {
        let spamWarnings = 0;
        let highRisk = false;

        currentStepPreviews.forEach(preview => {
            const spamResult = preview.spamAnalysis;
            spamWarnings += spamResult.warnings.length;
            if (spamResult.riskLevel === SpamRiskLevel.HIGH) {
                highRisk = true;
            }
        });

        return { totalSpamWarnings: spamWarnings, hasHighSpamRisk: highRisk };
    }, [currentStepPreviews]);

    // Actions
    const open = useCallback(() => {
        setIsOpen(true);
        setCurrentProspectIndex(0);
        setCurrentStepIndex(0);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    const nextProspect = useCallback(() => {
        if (currentProspectIndex < prospects.length - 1) {
            setCurrentProspectIndex(prev => prev + 1);
        }
    }, [currentProspectIndex, prospects.length]);

    const prevProspect = useCallback(() => {
        if (currentProspectIndex > 0) {
            setCurrentProspectIndex(prev => prev - 1);
        }
    }, [currentProspectIndex]);

    const goToStep = useCallback((stepIndex: number) => {
        if (stepIndex >= 0 && stepIndex < steps.length) {
            setCurrentStepIndex(stepIndex);
        }
    }, [steps.length]);

    const goToProspect = useCallback((prospectIndex: number) => {
        if (prospectIndex >= 0 && prospectIndex < prospects.length) {
            setCurrentProspectIndex(prospectIndex);
        }
    }, [prospects.length]);

    return {
        // State
        isOpen,
        currentProspectIndex,
        currentStepIndex,

        // Computed
        currentProspect,
        currentStepPreviews,
        totalWarnings,
        warningDetails,
        totalSpamWarnings,
        hasHighSpamRisk,

        // Methods
        open,
        close,
        nextProspect,
        prevProspect,
        goToStep,
        goToProspect,

        // Helpers
        hasNextProspect: currentProspectIndex < prospects.length - 1,
        hasPrevProspect: currentProspectIndex > 0,
        prospectCount: prospects.length,
        stepCount: steps.length,
    };
}

