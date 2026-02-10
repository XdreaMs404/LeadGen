/**
 * ProspectControlDropdown Component
 * Story 5.7: Individual Lead Control within Campaign
 * 
 * Dropdown menu for pause/resume/stop actions on individual prospects.
 */

'use client';

import { useState } from 'react';
import { EnrollmentStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
    MoreHorizontal,
    Pause,
    Play,
    StopCircle,
    Loader2,
} from 'lucide-react';
import { useProspectStatusMutation } from '@/hooks/use-prospect-control';
import type { ProspectAction } from '@/types/prospect-control';

interface ProspectControlDropdownProps {
    campaignId: string;
    prospectId: string;
    prospectName: string;
    enrollmentStatus: EnrollmentStatus;
    disabled?: boolean;
}

export function ProspectControlDropdown({
    campaignId,
    prospectId,
    prospectName,
    enrollmentStatus,
    disabled = false,
}: ProspectControlDropdownProps) {
    const [showStopDialog, setShowStopDialog] = useState(false);
    const { mutate, isPending } = useProspectStatusMutation(campaignId);

    const handleAction = (action: ProspectAction) => {
        if (action === 'stop') {
            setShowStopDialog(true);
            return;
        }

        mutate({ prospectId, action, prospectName });
    };

    const handleConfirmStop = () => {
        mutate({ prospectId, action: 'stop', prospectName });
        setShowStopDialog(false);
    };

    // Determine available actions based on current status
    const canPause = enrollmentStatus === 'ENROLLED';
    const canResume = enrollmentStatus === 'PAUSED';
    const canStop =
        enrollmentStatus === 'ENROLLED' || enrollmentStatus === 'PAUSED';

    // No actions available for terminal states
    const hasActions = canPause || canResume || canStop;

    if (!hasActions) {
        return (
            <Button variant="ghost" size="sm" disabled>
                <MoreHorizontal className="h-4 w-4 opacity-50" />
            </Button>
        );
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={disabled || isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MoreHorizontal className="h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {canPause && (
                        <DropdownMenuItem onClick={() => handleAction('pause')}>
                            <Pause className="mr-2 h-4 w-4" />
                            Mettre en pause
                        </DropdownMenuItem>
                    )}
                    {canResume && (
                        <DropdownMenuItem onClick={() => handleAction('resume')}>
                            <Play className="mr-2 h-4 w-4" />
                            Reprendre
                        </DropdownMenuItem>
                    )}
                    {canStop && (
                        <>
                            {(canPause || canResume) && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                                onClick={() => handleAction('stop')}
                                className="text-red-600 focus:text-red-600"
                            >
                                <StopCircle className="mr-2 h-4 w-4" />
                                Arrêter
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Arrêter les envois pour ce prospect ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Les emails restants
                            pour <strong>{prospectName}</strong> seront annulés
                            et ne pourront pas être reprogrammés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmStop}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Arrêter définitivement
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
