'use client';

import Link from 'next/link';
import { MoreHorizontal, Layers, Calendar, Edit, Trash2, Copy, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SequenceStatusBadge } from './SequenceStatusBadge';
import type { SequenceListItem } from '@/types/sequence';

interface SequenceCardProps {
    sequence: SequenceListItem;
    onDelete: (sequence: SequenceListItem) => void;
    onDuplicate?: (sequence: SequenceListItem) => void; // Story 4.7
    onSaveAsTemplate?: (sequence: SequenceListItem) => void; // Story 4.7
}

/**
 * Sequence Card Component
 * Story 4.1 - Task 6
 * Updated Story 4.7 - Added Duplicate and Save as Template actions
 * Displays sequence info in a card with actions
 */
export function SequenceCard({ sequence, onDelete, onDuplicate, onSaveAsTemplate }: SequenceCardProps) {
    const formattedDate = new Date(sequence.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <Card className="border-0 shadow-lg shadow-slate-100 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <Link
                        href={`/sequences/${sequence.id}/edit`}
                        className="flex-1 min-w-0"
                    >
                        <div className="space-y-3">
                            {/* Name */}
                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                                {sequence.name}
                            </h3>

                            {/* Meta info */}
                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <Layers className="h-4 w-4" />
                                    <span>{sequence.stepsCount} étape{sequence.stepsCount > 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formattedDate}</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <SequenceStatusBadge status={sequence.status} />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/sequences/${sequence.id}/edit`} className="flex items-center gap-2">
                                        <Edit className="h-4 w-4" />
                                        Modifier
                                    </Link>
                                </DropdownMenuItem>
                                {onDuplicate && (
                                    <DropdownMenuItem
                                        onClick={() => onDuplicate(sequence)}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Dupliquer
                                    </DropdownMenuItem>
                                )}
                                {onSaveAsTemplate && (
                                    <DropdownMenuItem
                                        onClick={() => onSaveAsTemplate(sequence)}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Enregistrer comme modèle
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                    onClick={() => onDelete(sequence)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

