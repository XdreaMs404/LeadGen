'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { SequenceCard } from './SequenceCard';
import type { SequenceListItem } from '@/types/sequence';

interface SequenceListProps {
    sequences: SequenceListItem[];
    isLoading: boolean;
    onDelete: (sequence: SequenceListItem) => void;
}

/**
 * Sequence List Component
 * Story 4.1 - Task 6
 * Displays sequences in a grid with skeleton loading
 */
export function SequenceList({ sequences, isLoading, onDelete }: SequenceListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-white/80 dark:bg-slate-900/80 p-6 space-y-4 shadow-lg">
                        <Skeleton className="h-6 w-3/4" />
                        <div className="flex gap-4">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (sequences.length === 0) {
        return null; // Empty state handled by parent
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sequences.map((sequence) => (
                <SequenceCard
                    key={sequence.id}
                    sequence={sequence}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
