'use client';

/**
 * Campaign Control Bar Component
 * Story 5.6: Campaign Control (Pause/Resume/Stop Global)
 * 
 * Control buttons for pause/resume/stop with confirmation dialog for stop
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CampaignStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Pause, Play, Square, Copy, Loader2, Trash2 } from 'lucide-react';
import { useCampaignStatusMutation } from '@/hooks/use-campaign-control';
import { useWorkspace } from '@/hooks/use-workspace';
import { toast } from 'sonner';

interface CampaignControlBarProps {
    campaignId: string;
    status: CampaignStatus;
    pendingEmailsCount?: number;
    className?: string;
    onDelete?: () => void;
}

export function CampaignControlBar({
    campaignId,
    status,
    pendingEmailsCount = 0,
    className,
    onDelete,
}: CampaignControlBarProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();
    const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
    const { mutate: updateStatus, isPending } = useCampaignStatusMutation();
    const [isDuplicating, setIsDuplicating] = useState(false);

    const handlePause = () => {
        updateStatus({ campaignId, action: 'pause' });
    };

    const handleResume = () => {
        updateStatus({ campaignId, action: 'resume' });
    };

    const handleStop = () => {
        updateStatus({ campaignId, action: 'stop' }, {
            onSuccess: () => {
                setIsStopDialogOpen(false);
            },
        });
    };

    const handleDuplicate = async () => {
        setIsDuplicating(true);
        try {
            const response = await fetch(`/api/campaigns/${campaignId}/duplicate`, {
                method: 'POST',
            });
            const json = await response.json();

            if (!json.success) {
                throw new Error(json.error?.message || 'Erreur lors de la duplication');
            }

            toast.success(`Campagne "${json.data.campaign.name}" créée`);
            // Invalidate campaigns query and redirect to campaigns list
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
            }
            router.push('/campaigns');
        } catch (error) {
            toast.error('Erreur lors de la duplication', {
                description: error instanceof Error ? error.message : 'Erreur inconnue',
            });
        } finally {
            setIsDuplicating(false);
        }
    };

    // Determine which buttons to show based on status
    const showPause = status === 'RUNNING';
    const showResume = status === 'PAUSED';
    const showStop = status === 'RUNNING' || status === 'PAUSED';
    const showDuplicate = status === 'STOPPED' || status === 'COMPLETED';
    const showDelete = status === 'STOPPED' && onDelete;

    // Don't render anything for DRAFT status
    if (status === 'DRAFT') {
        return null;
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Pause Button */}
            {showPause && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePause}
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Pause className="h-4 w-4 mr-2" />
                    )}
                    Mettre en pause
                </Button>
            )}

            {/* Resume Button */}
            {showResume && (
                <Button
                    variant="default"
                    size="sm"
                    onClick={handleResume}
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Play className="h-4 w-4 mr-2" />
                    )}
                    Reprendre
                </Button>
            )}

            {/* Stop Button with Confirmation Dialog */}
            {showStop && (
                <AlertDialog open={isStopDialogOpen} onOpenChange={setIsStopDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isPending}
                        >
                            <Square className="h-4 w-4 mr-2" />
                            Arrêter
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Arrêter la campagne ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible.
                                {pendingEmailsCount > 0 && (
                                    <span className="block mt-2 font-medium text-destructive">
                                        {pendingEmailsCount} email(s) en attente seront annulés.
                                    </span>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleStop}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Confirmer l'arrêt
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Duplicate Button (for stopped/completed campaigns) */}
            {showDuplicate && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDuplicate}
                    disabled={isDuplicating}
                >
                    {isDuplicating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Copy className="h-4 w-4 mr-2" />
                    )}
                    Dupliquer
                </Button>
            )}

            {/* Delete Button (for stopped campaigns only) */}
            {showDelete && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onDelete}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
