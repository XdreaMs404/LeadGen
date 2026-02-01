'use client';

import { useMemo } from 'react';
import { useSequences } from '@/hooks/use-sequences';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SEQUENCE_STATUS_LABELS } from '@/lib/constants/sequences';
import { Mail, CheckCircle2, Clock, Lock, Layers } from 'lucide-react';

interface SequenceSelectorProps {
    selectedSequenceId: string | null;
    onSelect: (sequenceId: string) => void;
}

/**
 * SequenceSelector Component - Story 5.2 (AC2)
 * Premium redesign with modern card-based selection
 */
export function SequenceSelector({ selectedSequenceId, onSelect }: SequenceSelectorProps) {
    const { data, isLoading } = useSequences();

    const sequences = useMemo(() => {
        if (!data?.sequences) return [];
        return data.sequences.filter(seq => seq.status !== 'ARCHIVED');
    }, [data?.sequences]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                        <Skeleton className="h-5 w-48 mb-1" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="grid gap-3">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (sequences.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-6">
                    <Mail className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Aucune séquence disponible
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    Créez une séquence et validez-la avec l&apos;aperçu copilot pour pouvoir la sélectionner.
                </p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-xl border border-teal-500/20">
                        <Mail className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Choisissez votre séquence
                        </h3>
                        <p className="text-sm text-slate-500">
                            Sélectionnez une séquence validée pour lancer votre campagne
                        </p>
                    </div>
                </div>

                {/* Sequence cards */}
                <div className="grid gap-3">
                    {sequences.map((sequence) => {
                        const isReady = sequence.status === 'READY';
                        const isSelected = selectedSequenceId === sequence.id;

                        const SequenceCard = (
                            <button
                                key={sequence.id}
                                onClick={() => isReady && onSelect(sequence.id)}
                                disabled={!isReady}
                                className={cn(
                                    'w-full group relative overflow-hidden rounded-xl border-2 p-5 text-left transition-all duration-300',
                                    isReady && !isSelected && 'border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-emerald-50/50 dark:hover:from-teal-950/30 dark:hover:to-emerald-950/30 hover:shadow-lg hover:shadow-teal-500/10 cursor-pointer',
                                    isSelected && 'border-teal-500 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 shadow-lg shadow-teal-500/20 ring-4 ring-teal-500/10',
                                    !isReady && 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-60 cursor-not-allowed'
                                )}
                            >
                                {/* Selected indicator glow */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 animate-pulse" />
                                )}

                                <div className="relative flex items-center gap-4">
                                    {/* Icon / Status indicator */}
                                    <div className={cn(
                                        'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
                                        isReady && !isSelected && 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 group-hover:from-teal-100 group-hover:to-emerald-100',
                                        isSelected && 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/30',
                                        !isReady && 'bg-slate-100 dark:bg-slate-800'
                                    )}>
                                        {isSelected ? (
                                            <CheckCircle2 className="h-6 w-6 text-white" />
                                        ) : !isReady ? (
                                            <Lock className="h-5 w-5 text-slate-400" />
                                        ) : (
                                            <Layers className="h-5 w-5 text-slate-500 group-hover:text-teal-600 transition-colors" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={cn(
                                                'font-semibold text-base truncate transition-colors',
                                                isSelected ? 'text-teal-700 dark:text-teal-400' : 'text-slate-900 dark:text-white'
                                            )}>
                                                {sequence.name}
                                            </span>
                                            <Badge
                                                variant={isReady ? 'default' : 'secondary'}
                                                className={cn(
                                                    'flex-shrink-0 text-xs',
                                                    isReady && 'bg-gradient-to-r from-green-500 to-emerald-600 border-0'
                                                )}
                                            >
                                                {isReady ? '✓ Prête' : SEQUENCE_STATUS_LABELS[sequence.status] || sequence.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <Mail className="h-3.5 w-3.5" />
                                                {sequence.stepsCount} étape{sequence.stepsCount > 1 ? 's' : ''}
                                            </span>
                                            {!isReady && (
                                                <span className="flex items-center gap-1.5 text-amber-600">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Validation requise
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Selection indicator */}
                                    <div className={cn(
                                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300',
                                        isSelected && 'border-teal-500 bg-teal-500',
                                        !isSelected && isReady && 'border-slate-300 dark:border-slate-600 group-hover:border-teal-400',
                                        !isReady && 'border-slate-200 dark:border-slate-700'
                                    )}>
                                        {isSelected && (
                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        );

                        if (!isReady) {
                            return (
                                <Tooltip key={sequence.id}>
                                    <TooltipTrigger asChild>
                                        {SequenceCard}
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 text-white border-0 px-3 py-2">
                                        <p>Complétez l&apos;aperçu copilot avant de lancer</p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return SequenceCard;
                    })}
                </div>
            </div>
        </TooltipProvider>
    );
}
