'use client';

import { Badge } from '@/components/ui/badge';
import type { SequenceStatusType } from '@/types/sequence';
import { cn } from '@/lib/utils';

interface SequenceStatusBadgeProps {
    status: SequenceStatusType;
    className?: string;
}

const statusConfig: Record<SequenceStatusType, { label: string; className: string }> = {
    DRAFT: {
        label: 'Brouillon',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    READY: {
        label: 'Prête',
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    ARCHIVED: {
        label: 'Archivée',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 line-through',
    },
};

/**
 * Sequence Status Badge Component
 * Story 4.1 - Task 10
 */
export function SequenceStatusBadge({ status, className }: SequenceStatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <Badge
            variant="secondary"
            className={cn(config.className, className)}
        >
            {config.label}
        </Badge>
    );
}
