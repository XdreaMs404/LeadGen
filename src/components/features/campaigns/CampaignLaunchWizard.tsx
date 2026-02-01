'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Rocket, Check, Loader2, Mail, Users, Shield, Sparkles } from 'lucide-react';

import { SequenceSelector } from './SequenceSelector';
import { ProspectSelector } from './ProspectSelector';
import { PreLaunchReview } from './PreLaunchReview';
import { useLaunchCampaign } from '@/hooks/use-campaigns';

interface CampaignLaunchWizardProps {
    campaignId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface WizardState {
    step: 1 | 2 | 3;
    selectedSequenceId: string | null;
    selectedProspectIds: string[];
    canLaunch: boolean;
}

const STEPS = [
    { number: 1, label: 'Séquence', description: 'Choisir le scénario', icon: Mail },
    { number: 2, label: 'Prospects', description: 'Sélectionner les cibles', icon: Users },
    { number: 3, label: 'Lancement', description: 'Vérifier & lancer', icon: Shield },
];

/**
 * CampaignLaunchWizard Component - Story 5.2 (AC1)
 * Fixed layout and accessibility issues
 */
export function CampaignLaunchWizard({ campaignId, open, onOpenChange }: CampaignLaunchWizardProps) {
    const [state, setState] = useState<WizardState>({
        step: 1,
        selectedSequenceId: null,
        selectedProspectIds: [],
        canLaunch: false,
    });

    const launchCampaign = useLaunchCampaign();

    const handleSequenceSelect = useCallback((sequenceId: string) => {
        setState(prev => ({ ...prev, selectedSequenceId: sequenceId }));
    }, []);

    const handleProspectSelectionChange = useCallback((prospectIds: string[]) => {
        setState(prev => ({ ...prev, selectedProspectIds: prospectIds }));
    }, []);

    const handleCheckComplete = useCallback((canLaunch: boolean) => {
        setState(prev => ({ ...prev, canLaunch }));
    }, []);

    const goToStep = useCallback((step: 1 | 2 | 3) => {
        setState(prev => ({ ...prev, step }));
    }, []);

    const handleNext = useCallback(() => {
        if (state.step < 3) {
            goToStep((state.step + 1) as 1 | 2 | 3);
        }
    }, [state.step, goToStep]);

    const handleBack = useCallback(() => {
        if (state.step > 1) {
            goToStep((state.step - 1) as 1 | 2 | 3);
        }
    }, [state.step, goToStep]);

    const handleLaunch = useCallback(async () => {
        if (!state.selectedSequenceId || state.selectedProspectIds.length === 0) return;

        launchCampaign.mutate(
            { campaignId, prospectIds: state.selectedProspectIds },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    setState({
                        step: 1,
                        selectedSequenceId: null,
                        selectedProspectIds: [],
                        canLaunch: false,
                    });
                },
            }
        );
    }, [campaignId, state.selectedSequenceId, state.selectedProspectIds, launchCampaign, onOpenChange]);

    const isNextDisabled =
        (state.step === 1 && !state.selectedSequenceId) ||
        (state.step === 2 && state.selectedProspectIds.length === 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[85vh] p-0 flex flex-col overflow-hidden rounded-2xl border-0 shadow-2xl bg-white dark:bg-slate-900">
                {/* Accessibility: Hidden title for screen readers using sr-only */}
                <DialogTitle className="sr-only">Lancer une campagne</DialogTitle>
                <DialogDescription className="sr-only">Configurez et lancez votre campagne en 3 étapes</DialogDescription>

                {/* Header with gradient */}
                <div className="flex-shrink-0 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Rocket className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Lancer une campagne</h2>
                            <p className="text-white/80 text-sm">Configurez et lancez votre campagne en 3 étapes</p>
                        </div>
                    </div>
                </div>

                {/* Stepper */}
                <div className="flex-shrink-0 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between gap-2">
                        {STEPS.map((s, index) => {
                            const Icon = s.icon;
                            const isActive = s.number === state.step;
                            const isCompleted = s.number < state.step;
                            const isClickable = s.number < state.step;

                            return (
                                <div key={s.number} className="flex items-center flex-1">
                                    <button
                                        onClick={() => isClickable && goToStep(s.number as 1 | 2 | 3)}
                                        disabled={!isClickable}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 w-full',
                                            isActive && 'bg-white dark:bg-slate-900 shadow-sm border border-teal-200 dark:border-teal-800',
                                            isCompleted && 'hover:bg-white dark:hover:bg-slate-900 cursor-pointer',
                                            !isActive && !isCompleted && 'opacity-50'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-medium',
                                            isActive && 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white',
                                            isCompleted && 'bg-green-500 text-white',
                                            !isActive && !isCompleted && 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                        )}>
                                            {isCompleted ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <Icon className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="hidden sm:block text-left min-w-0">
                                            <p className={cn(
                                                'font-medium text-sm truncate',
                                                isActive && 'text-teal-700 dark:text-teal-400',
                                                isCompleted && 'text-green-600',
                                                !isActive && !isCompleted && 'text-slate-400'
                                            )}>
                                                {s.label}
                                            </p>
                                        </div>
                                    </button>

                                    {index < STEPS.length - 1 && (
                                        <div className={cn(
                                            'w-8 h-0.5 mx-1 rounded-full flex-shrink-0',
                                            isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                                        )} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content - scrollable area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {state.step === 1 && (
                        <SequenceSelector
                            selectedSequenceId={state.selectedSequenceId}
                            onSelect={handleSequenceSelect}
                        />
                    )}
                    {state.step === 2 && (
                        <ProspectSelector
                            selectedProspectIds={state.selectedProspectIds}
                            onSelectionChange={handleProspectSelectionChange}
                        />
                    )}
                    {state.step === 3 && (
                        <PreLaunchReview
                            sequenceId={state.selectedSequenceId}
                            prospectIds={state.selectedProspectIds}
                            onCheckComplete={handleCheckComplete}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={state.step === 1}
                        className="text-slate-600"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Retour
                    </Button>

                    <div className="flex items-center gap-1.5">
                        {STEPS.map((s) => (
                            <div
                                key={s.number}
                                className={cn(
                                    'h-1.5 rounded-full transition-all duration-300',
                                    s.number === state.step ? 'w-6 bg-teal-500' : 'w-1.5',
                                    s.number < state.step && 'bg-green-500',
                                    s.number > state.step && 'bg-slate-300 dark:bg-slate-600'
                                )}
                            />
                        ))}
                    </div>

                    {state.step < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={isNextDisabled}
                            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                        >
                            Suivant
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleLaunch}
                            disabled={!state.canLaunch || launchCampaign.isPending}
                            className={cn(
                                'px-5',
                                state.canLaunch
                                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white'
                                    : 'bg-slate-200 text-slate-400'
                            )}
                        >
                            {launchCampaign.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Lancer
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
