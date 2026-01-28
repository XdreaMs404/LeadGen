'use client';

/**
 * Delete Prospect Dialog
 * Story 3.6: Confirmation dialog for single prospect deletion (AC1, AC2)
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
import { useProspectActiveCampaigns, useDeleteProspect } from '@/hooks/use-delete-prospect';
import type { Prospect } from '@/types/prospect';

interface DeleteProspectDialogProps {
    prospect: Prospect | null;
    workspaceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteProspectDialog({
    prospect,
    workspaceId,
    open,
    onOpenChange,
}: DeleteProspectDialogProps) {
    const { data: campaignsData, isLoading: loadingCampaigns } = useProspectActiveCampaigns(
        open ? prospect?.id ?? null : null
    );
    const { mutate: deleteProspect, isPending } = useDeleteProspect(workspaceId);

    const campaigns = campaignsData?.campaigns ?? [];
    const hasActiveCampaigns = campaigns.length > 0;

    const handleDelete = () => {
        if (!prospect) return;
        deleteProspect(prospect.id, {
            onSuccess: () => onOpenChange(false),
        });
    };

    if (!prospect) return null;

    const fullName = `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || prospect.email;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg">
                        Supprimer le prospect ?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p>
                                Vous êtes sur le point de supprimer{' '}
                                <span className="font-semibold text-foreground">{fullName}</span>.
                            </p>

                            {loadingCampaigns ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Vérification des campagnes...
                                </div>
                            ) : hasActiveCampaigns && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
                                        ⚠️ Ce prospect est dans {campaigns.length} campagne{campaigns.length > 1 ? 's' : ''} active{campaigns.length > 1 ? 's' : ''}.
                                    </p>
                                    <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                                        La suppression le retirera de ces campagnes et annulera les emails programmés.
                                    </p>
                                </div>
                            )}

                            <p className="text-sm text-muted-foreground">
                                Cette action est irréversible. Les données associées seront également supprimées.
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
                        disabled={isPending || loadingCampaigns}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Suppression...
                            </>
                        ) : (
                            'Supprimer définitivement'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
