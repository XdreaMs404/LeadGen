'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2, Mail, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { SequenceStep } from '@/types/sequence';
import { cn } from '@/lib/utils';
import { ALLOWED_DELAY_DAYS, DELAY_LABELS } from '@/lib/constants/sequences';

interface StepCardProps {
    step: SequenceStep;
    stepNumber: number;
    onEdit: (step: SequenceStep) => void;
    onDelete: (step: SequenceStep) => void;
    onDelayChange?: (step: SequenceStep, delayDays: number) => void;
}

/**
 * Sortable Step Card Component
 * Story 4.1 - Task 9, Story 4.2 - Task 1
 * Displays step info with drag handle for reordering and delay configuration
 */
export function StepCard({ step, stepNumber, onEdit, onDelete, onDelayChange }: StepCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: step.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Strip HTML for preview
    const bodyPreview = step.body
        .replace(/<[^>]*>/g, '')
        .slice(0, 100)
        .trim();

    const handleDelayChange = (value: string) => {
        if (onDelayChange) {
            onDelayChange(step, Number(value));
        }
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={cn(
                'border-0 shadow-lg shadow-slate-100 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-all duration-200',
                isDragging && 'opacity-50 shadow-2xl scale-105'
            )}
        >
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Drag handle */}
                    <button
                        className="mt-1 p-1 rounded cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-slate-800 touch-none"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-5 w-5 text-slate-400" />
                    </button>

                    {/* Step number badge */}
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 rounded-xl flex items-center justify-center">
                        <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                                Étape {stepNumber}
                            </span>
                        </div>
                        <h4 className="font-medium text-slate-900 dark:text-white truncate">
                            {step.subject || 'Sans objet'}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                            {bodyPreview || 'Contenu vide...'}
                        </p>

                        {/* Story 4.2 - AC1, AC2, AC6: Delay selector (only for steps after first) */}
                        {step.order > 1 && (
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Attendre</span>
                                <Select
                                    value={String(step.delayDays)}
                                    onValueChange={handleDelayChange}
                                >
                                    <SelectTrigger className="w-28 h-7 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ALLOWED_DELAY_DAYS.map((days) => (
                                            <SelectItem key={days} value={String(days)}>
                                                {DELAY_LABELS[days]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-sm text-muted-foreground">avant l&apos;envoi</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(step)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => onDelete(step)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

