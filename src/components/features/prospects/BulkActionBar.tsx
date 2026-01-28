'use client';

/**
 * Bulk Action Bar
 * Story 3.6: Action bar shown when prospects are selected (AC5)
 */
import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BulkDeleteDialog } from './BulkDeleteDialog';

interface BulkActionBarProps {
    selectedIds: string[];
    workspaceId: string;
    onClearSelection: () => void;
}

export function BulkActionBar({
    selectedIds,
    workspaceId,
    onClearSelection,
}: BulkActionBarProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    if (selectedIds.length === 0) return null;

    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700">
                    <span className="text-sm font-medium">
                        {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
                    </span>

                    <div className="w-px h-5 bg-slate-700" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Supprimer la sélection
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearSelection}
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <BulkDeleteDialog
                prospectIds={selectedIds}
                prospectCount={selectedIds.length}
                workspaceId={workspaceId}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onSuccess={onClearSelection}
            />
        </>
    );
}
