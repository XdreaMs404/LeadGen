'use client';

/**
 * CopilotPreviewModal Component
 * Story 4.5: Copilot Email Preview (Mandatory)
 * Story 4.6: Spam Risk Assessment & Warnings (MVP Heuristics)
 * Task 3: Create PreviewModal Component
 * Task 7: Enhance warning dialog for spam risk
 *
 * Full-featured preview modal with:
 * - Multi-step preview with tabs
 * - Sample navigation (Previous/Next)
 * - Edit button per step
 * - Approval flow with warning confirmation
 * - Spam risk warnings display (Story 4.6)
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    ChevronLeft,
    ChevronRight,
    Edit,
    CheckCircle2,
    AlertTriangle,
    Eye,
    Sparkles,
    ShieldAlert,
} from 'lucide-react';
import { EmailPreview } from './EmailPreview';
import type { Sequence, SequenceStep } from '@/types/sequence';
import type { PreviewProspect } from '@/lib/sequences/preview-renderer';
import type { StepPreview } from '@/hooks/use-preview-modal';
import { cn } from '@/lib/utils';

interface CopilotPreviewModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** The sequence being previewed */
    sequence: Sequence;
    /** Sequence steps to preview */
    steps: SequenceStep[];
    /** Sample prospects for preview */
    prospects: PreviewProspect[];
    /** Current prospect index */
    currentProspectIndex: number;
    /** Current step index */
    currentStepIndex: number;
    /** Rendered previews for current prospect */
    stepPreviews: StepPreview[];
    /** Total warning count (missing variables) */
    totalWarnings: number;
    /** Story 4.6: Total spam warning count */
    totalSpamWarnings: number;
    /** Story 4.6: Whether any step has HIGH spam risk */
    hasHighSpamRisk: boolean;
    /** Navigation callbacks */
    onNextProspect: () => void;
    onPrevProspect: () => void;
    onGoToStep: (index: number) => void;
    hasNextProspect: boolean;
    hasPrevProspect: boolean;
    /** Callback when user clicks edit on a step */
    onEditStep: (stepId: string) => void;
    /** Callback when user approves the sequence */
    onApprove: () => void;
    /** Whether approval is in progress */
    isApproving?: boolean;
}

/**
 * CopilotPreviewModal - Full preview experience for email sequences
 */
export function CopilotPreviewModal({
    isOpen,
    onClose,
    sequence,
    steps,
    prospects,
    currentProspectIndex,
    currentStepIndex,
    stepPreviews,
    totalWarnings,
    totalSpamWarnings,
    hasHighSpamRisk,
    onNextProspect,
    onPrevProspect,
    onGoToStep,
    hasNextProspect,
    hasPrevProspect,
    onEditStep,
    onApprove,
    isApproving = false,
}: CopilotPreviewModalProps) {
    const [showWarningDialog, setShowWarningDialog] = useState(false);

    const currentProspect = prospects[currentProspectIndex];
    const currentPreview = stepPreviews[currentStepIndex];

    // Story 4.6: Track whether to show high spam risk dialog
    const hasAnyWarnings = totalWarnings > 0 || hasHighSpamRisk;

    // Handle approve click - show warning dialog if there are warnings
    const handleApproveClick = () => {
        if (hasAnyWarnings) {
            setShowWarningDialog(true);
        } else {
            onApprove();
        }
    };

    // Handle confirm despite warnings
    const handleConfirmWithWarnings = () => {
        setShowWarningDialog(false);
        onApprove();
    };

    if (!currentProspect || !currentPreview) {
        return null;
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <DialogHeader className="flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg">
                                <Eye className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">
                                    Prévisualisation Copilot
                                </DialogTitle>
                                <DialogDescription>
                                    {sequence.name} • {steps.length} étape{steps.length > 1 ? 's' : ''}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Prospect navigation */}
                    <div className="flex items-center justify-between py-3 border-y border-slate-100 dark:border-slate-800 flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onPrevProspect}
                            disabled={!hasPrevProspect}
                            className="gap-1"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Précédent
                        </Button>

                        <div className="text-center">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {currentProspect.firstName} {currentProspect.lastName}
                            </div>
                            <div className="text-xs text-slate-500">
                                Aperçu {currentProspectIndex + 1} sur {prospects.length}
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNextProspect}
                            disabled={!hasNextProspect}
                            className="gap-1"
                        >
                            Suivant
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Step tabs */}
                    <Tabs
                        value={String(currentStepIndex)}
                        onValueChange={(v) => onGoToStep(Number(v))}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        <TabsList className="flex-shrink-0 grid w-full" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
                            {stepPreviews.map((preview, index) => (
                                <TabsTrigger
                                    key={preview.stepId}
                                    value={String(index)}
                                    className="gap-2"
                                >
                                    <span className={cn(
                                        "flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold",
                                        index === currentStepIndex
                                            ? "bg-teal-500 text-white"
                                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    )}>
                                        {preview.stepNumber}
                                    </span>
                                    <span className="hidden sm:inline">Étape {preview.stepNumber}</span>
                                    {(preview.subject.missingVariables.length > 0 ||
                                        preview.body.missingVariables.length > 0) && (
                                            <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center">
                                                <AlertTriangle className="h-3 w-3" />
                                            </Badge>
                                        )}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {/* Step content */}
                        <div className="flex-1 overflow-y-auto py-4">
                            {stepPreviews.map((preview, index) => (
                                <TabsContent
                                    key={preview.stepId}
                                    value={String(index)}
                                    className="m-0 data-[state=active]:block"
                                >
                                    <div className="space-y-4">
                                        <EmailPreview
                                            subject={preview.subject}
                                            body={preview.body}
                                            prospect={currentProspect}
                                            sampleNumber={currentProspectIndex + 1}
                                            totalSamples={prospects.length}
                                            stepNumber={preview.stepNumber}
                                            delayDays={preview.delayDays}
                                            spamAnalysis={preview.spamAnalysis}
                                        />

                                        {/* Edit button */}
                                        <div className="flex justify-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEditStep(preview.stepId)}
                                                className="gap-2"
                                            >
                                                <Edit className="h-4 w-4" />
                                                Modifier cette étape
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>

                    {/* Footer with approval */}
                    <DialogFooter className="flex-shrink-0 flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div className="flex items-center gap-2 text-sm">
                            {hasHighSpamRisk ? (
                                <>
                                    <ShieldAlert className="h-4 w-4 text-red-500" />
                                    <span className="text-red-600 dark:text-red-400">
                                        Risque spam élevé détecté
                                    </span>
                                </>
                            ) : totalWarnings > 0 || totalSpamWarnings > 0 ? (
                                <>
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    <span className="text-amber-600 dark:text-amber-400">
                                        {totalWarnings + totalSpamWarnings} avertissement{totalWarnings + totalSpamWarnings > 1 ? 's' : ''}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                        Tous les emails sont prêts
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Fermer
                            </Button>
                            <Button
                                onClick={handleApproveClick}
                                disabled={isApproving}
                                className="gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                            >
                                <Sparkles className="h-4 w-4" />
                                {isApproving ? 'Approbation...' : 'Approuver et Programmer'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Warning confirmation dialog */}
            <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            {hasHighSpamRisk ? (
                                <>
                                    <ShieldAlert className="h-5 w-5 text-red-500" />
                                    Risque de spam élevé
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Emails avec avertissements
                                </>
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                {hasHighSpamRisk && (
                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                        <p className="text-sm text-red-700 dark:text-red-300">
                                            <strong>Attention :</strong> Vos emails présentent un risque élevé d'être marqués comme spam.
                                            Cela pourrait affecter la délivrabilité et la réputation de votre domaine.
                                        </p>
                                    </div>
                                )}
                                {totalWarnings > 0 && (
                                    <p className="text-sm text-amber-600 dark:text-amber-400">
                                        {totalWarnings} email{totalWarnings > 1 ? 's' : ''} ont des variables manquantes.
                                    </p>
                                )}
                                {totalSpamWarnings > 0 && !hasHighSpamRisk && (
                                    <p className="text-sm text-amber-600 dark:text-amber-400">
                                        {totalSpamWarnings} avertissement{totalSpamWarnings > 1 ? 's' : ''} de spam détecté{totalSpamWarnings > 1 ? 's' : ''}.
                                    </p>
                                )}
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Voulez-vous continuer malgré ces avertissements ?
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler et réviser</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmWithWarnings}
                            className={hasHighSpamRisk ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}
                        >
                            {hasHighSpamRisk ? "Je comprends les risques" : "Continuer malgré les avertissements"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
