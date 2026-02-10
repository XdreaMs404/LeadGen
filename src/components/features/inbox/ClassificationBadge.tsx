'use client';

/**
 * Classification Badge Component (Story 6.3 AC2)
 * 
 * Displays reply classification with color-coded styling.
 * Matches the ReplyClassification enum values from Prisma schema.
 */

import { cn } from '@/lib/utils';
import type { ReplyClassification } from '@prisma/client';

interface ClassificationBadgeProps {
    classification: ReplyClassification;
    confidenceScore?: number;
    showConfidence?: boolean;
    size?: 'sm' | 'md';
}

const classificationConfig: Record<ReplyClassification, { label: string; className: string }> = {
    INTERESTED: {
        label: '🔥 Intéressé',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    NOT_INTERESTED: {
        label: '👎 Pas intéressé',
        className: 'bg-red-50 text-red-700 border-red-200',
    },
    OUT_OF_OFFICE: {
        label: '🏖️ Absent',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    UNSUBSCRIBE: {
        label: '🚫 Désinscrit',
        className: 'bg-slate-100 text-slate-600 border-slate-300',
    },
    BOUNCE: {
        label: '⚠️ Bounce',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    OTHER: {
        label: '❓ À vérifier',
        className: 'bg-violet-50 text-violet-700 border-violet-200',
    },
};

const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
};

export function ClassificationBadge({
    classification,
    confidenceScore,
    showConfidence = true,
    size = 'sm'
}: ClassificationBadgeProps) {
    const config = classificationConfig[classification];

    if (!config) {
        return null;
    }

    // Show low confidence indicator if score is below 80%
    const showLowConfidence = showConfidence && confidenceScore !== undefined && confidenceScore < 0.8;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full border font-medium",
                config.className,
                sizeClasses[size]
            )}
        >
            {config.label}
            {showLowConfidence && (
                <span
                    className="text-[0.6rem] opacity-60"
                    title={`Confiance: ${Math.round(confidenceScore * 100)}%`}
                >
                    ?
                </span>
            )}
        </span>
    );
}
