'use client';

/**
 * SpamWarningsPanel Component
 * Story 4.6: Spam Risk Assessment & Warnings (MVP Heuristics)
 * Task 5: Create SpamWarningsPanel Component
 *
 * Displays an expandable panel with spam warning details:
 * - Lists each warning with icon based on severity
 * - Groups warnings by category
 * - Special handling for unsubscribe warning
 */

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { type SpamWarning, type SpamWarningType } from '@/lib/sequences/spam-analyzer';
import { cn } from '@/lib/utils';

interface SpamWarningsPanelProps {
    /** List of spam warnings to display */
    warnings: SpamWarning[];
    /** Whether the panel is expanded */
    isExpanded: boolean;
    /** Optional className */
    className?: string;
}

// Map warning types to categories for grouping
const WARNING_CATEGORIES: Record<SpamWarningType, string> = {
    word_count_low: 'Longueur',
    word_count_high: 'Longueur',
    link_count: 'Liens',
    risky_words: 'Mots à risque',
    excessive_punctuation: 'Format',
    all_caps: 'Format',
    missing_unsubscribe: 'Conformité',
};

// Map severity to icon and color
const SEVERITY_CONFIG = {
    low: {
        icon: Info,
        containerClass: 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50',
        iconClass: 'text-slate-400 dark:text-slate-500',
    },
    medium: {
        icon: AlertTriangle,
        containerClass: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20',
        iconClass: 'text-amber-500 dark:text-amber-400',
    },
    high: {
        icon: AlertCircle,
        containerClass: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
        iconClass: 'text-red-500 dark:text-red-400',
    },
};

/**
 * SpamWarningsPanel - Expandable panel showing spam warning details
 */
export function SpamWarningsPanel({
    warnings,
    isExpanded,
    className,
}: SpamWarningsPanelProps) {
    if (warnings.length === 0 || !isExpanded) {
        return null;
    }

    // Group warnings by category
    const groupedWarnings = warnings.reduce<Record<string, SpamWarning[]>>((acc, warning) => {
        const category = WARNING_CATEGORIES[warning.type] || 'Autre';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(warning);
        return acc;
    }, {});

    return (
        <div
            className={cn(
                'mt-3 space-y-2 overflow-hidden transition-all duration-200 ease-in-out',
                isExpanded ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0',
                className
            )}
            role="region"
            aria-label="Détails des avertissements spam"
        >
            {Object.entries(groupedWarnings).map(([category, categoryWarnings]) => (
                <div key={category} className="space-y-1.5">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {category}
                    </div>
                    {categoryWarnings.map((warning, index) => {
                        const config = SEVERITY_CONFIG[warning.severity];
                        const Icon = config.icon;
                        const isUnsubscribe = warning.type === 'missing_unsubscribe';

                        return (
                            <div
                                key={`${warning.type}-${index}`}
                                className={cn(
                                    'flex items-start gap-2 p-2.5 rounded-lg border text-sm',
                                    config.containerClass
                                )}
                            >
                                <Icon
                                    className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.iconClass)}
                                    aria-hidden="true"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-700 dark:text-slate-300 leading-snug">
                                        {warning.message}
                                    </p>
                                    {isUnsubscribe && (
                                        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                            ✓ Sera ajouté automatiquement à l'envoi
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
