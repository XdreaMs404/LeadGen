'use client';

/**
 * Bulk Delete Prospects Dialog
 * Story 3.6: Confirmation dialog for bulk prospect deletion (AC5)
 */
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useBulkDeleteProspects } from '@/hooks/use-delete-prospect';

interface BulkDeleteDialogProps {
    prospectIds: string[];
    prospectCount: number;
    workspaceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function BulkDeleteDialog({
    prospectIds,
    prospectCount,
    workspaceId,
    open,
    onOpenChange,
    onSuccess,
}: BulkDeleteDialogProps) {
    const { mutate: bulkDelete, isPending } = useBulkDeleteProspects(workspaceId);

    const handleDelete = () => {
        bulkDelete(prospectIds, {
            onSuccess: () => {
                onOpenChange(false);
                onSuccess?.();
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg">
                        Supprimer {prospectCount} prospect{prospectCount > 1 ? 's' : ''} ?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p>
                                Vous êtes sur le point de supprimer{' '}
                                <span className="font-semibold text-foreground">
                                    {prospectCount} prospect{prospectCount > 1 ? 's' : ''}
                                </span>.
                            </p>

                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
                                    ⚠️ Suppression groupée
                                </p>
                                <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                                    Les prospects seront retirés de leurs campagnes actives et leurs emails programmés seront annulés.
                                </p>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Cette action est irréversible.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Suppression...
                            </>
                        ) : (
                            `Supprimer ${prospectCount} prospect${prospectCount > 1 ? 's' : ''}`
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
