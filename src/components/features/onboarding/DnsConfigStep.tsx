'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WizardStepper, type WizardStep, type StepStatus } from '@/components/shared/WizardStepper';
import { SpfStep } from './SpfStep';
import { DkimStep } from './DkimStep';
import { DmarcStep } from './DmarcStep';
import { useDnsStatus } from '@/hooks/use-dns-status';
import type { DnsStatus } from '@/types/dns';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, Shield, Sparkles, Mail, Zap } from 'lucide-react';

type DnsStepId = 'spf' | 'dkim' | 'dmarc';

interface DnsConfigStepProps {
    onComplete: () => void;
}

function mapDnsStatusToStepStatus(status: DnsStatus): StepStatus {
    switch (status) {
        case 'PASS':
        case 'MANUAL_OVERRIDE':
            return 'pass';
        case 'FAIL':
            return 'fail';
        case 'UNKNOWN':
            return 'unknown';
        default:
            return 'not-checked';
    }
}

/**
 * DnsConfigStep - Container for the DNS configuration wizard
 * Manages navigation between SPF, DKIM, and DMARC steps
 */
export function DnsConfigStep({ onComplete }: DnsConfigStepProps) {
    const [currentStep, setCurrentStep] = useState<DnsStepId>('spf');
    const { spfStatus, dkimStatus, dmarcStatus, dkimSelector, domain, isLoading } = useDnsStatus();

    const steps: WizardStep[] = [
        {
            id: 'spf',
            label: 'SPF',
            status: currentStep === 'spf' ? 'active' : mapDnsStatusToStepStatus(spfStatus),
        },
        {
            id: 'dkim',
            label: 'DKIM',
            status: currentStep === 'dkim' ? 'active' : mapDnsStatusToStepStatus(dkimStatus),
        },
        {
            id: 'dmarc',
            label: 'DMARC',
            status: currentStep === 'dmarc' ? 'active' : mapDnsStatusToStepStatus(dmarcStatus),
        },
    ];

    const stepOrder: DnsStepId[] = ['spf', 'dkim', 'dmarc'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const isFirstStep = currentIndex === 0;
    const isLastStep = currentIndex === stepOrder.length - 1;

    const handlePrevious = () => {
        if (!isFirstStep) {
            setCurrentStep(stepOrder[currentIndex - 1]);
        }
    };

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep(stepOrder[currentIndex + 1]);
        }
    };

    const handleStepClick = (stepId: string) => {
        if (stepOrder.includes(stepId as DnsStepId)) {
            setCurrentStep(stepId as DnsStepId);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full blur-xl opacity-30 animate-pulse" />
                        <Loader2 className="h-12 w-12 animate-spin text-teal-600 relative" />
                    </div>
                    <p className="text-muted-foreground text-sm">Chargement de votre configuration...</p>
                </div>
            </div>
        );
    }

    // Handle Personal Gmail addresses
    const isPersonalGmail = domain === 'gmail.com' || domain === 'googlemail.com';

    if (isPersonalGmail) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
                {/* Success Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 flex flex-col items-center text-center gap-4">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-2">
                                Tout est configuré ! 🎉
                            </h2>
                            <p className="text-white/90 text-lg">
                                Google gère automatiquement la sécurité de vos emails.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <Card className="border-0 shadow-lg shadow-slate-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Shield className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Compte Gmail Personnel détecté</h3>
                                <p className="text-muted-foreground">
                                    Votre adresse <span className="font-medium text-foreground">@gmail.com</span> bénéficie
                                    automatiquement de la protection SPF et DKIM de Google.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                <span className="text-sm">Authentification SPF activée par Google</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                <span className="text-sm">Signature DKIM gérée automatiquement</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                <span className="text-sm">Emails authentifiés et sécurisés</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quotas & Tips */}
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Mail className="h-5 w-5 text-blue-600" />
                                </div>
                                <h4 className="font-semibold">Gmail Personnel</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">Parfait pour débuter</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-blue-600">~50</span>
                                <span className="text-sm text-muted-foreground">emails / jour max</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-violet-50 to-purple-50">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                    <Zap className="h-5 w-5 text-violet-600" />
                                </div>
                                <h4 className="font-semibold">Google Workspace</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">Pour passer à la vitesse supérieure</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-violet-600">150+</span>
                                <span className="text-sm text-muted-foreground">emails / jour</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pro Tip */}
                <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-r from-amber-50 to-orange-50">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Sparkles className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">Conseil Pro</h4>
                                <p className="text-sm text-muted-foreground">
                                    Commencez doucement avec votre adresse actuelle. Si vous atteignez régulièrement
                                    la limite des 50 envois, passez à un compte{' '}
                                    <span className="font-medium text-foreground">Google Workspace</span> pour
                                    protéger votre délivrabilité.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CTA Button */}
                <div className="flex justify-center pt-4">
                    <Button
                        onClick={onComplete}
                        size="lg"
                        className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-500/25 transition-all hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5"
                    >
                        Continuer vers le Dashboard
                        <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                    <Shield className="h-4 w-4" />
                    Configuration DNS
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">
                    Sécurisez votre délivrabilité
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    Configurez vos enregistrements DNS pour garantir que vos emails arrivent en boîte de réception.
                </p>
            </div>

            {/* DNS Stepper */}
            <WizardStepper
                steps={steps}
                currentStepId={currentStep}
                onStepClick={handleStepClick}
            />

            {/* Step Content */}
            <Card className="border-0 shadow-xl shadow-slate-200/50">
                <CardContent className="p-6 md:p-8">
                    {currentStep === 'spf' && (
                        <SpfStep domain={domain} status={spfStatus} />
                    )}
                    {currentStep === 'dkim' && (
                        <DkimStep domain={domain} status={dkimStatus} selector={dkimSelector} />
                    )}
                    {currentStep === 'dmarc' && (
                        <DmarcStep domain={domain} status={dmarcStatus} />
                    )}
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
                <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    disabled={isFirstStep}
                    className="h-12 px-6"
                    data-testid="dns-prev-button"
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Précédent
                </Button>

                <Button
                    onClick={handleNext}
                    className="h-12 px-8 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-500/25 transition-all hover:shadow-xl hover:shadow-teal-500/30"
                    data-testid="dns-next-button"
                >
                    {isLastStep ? 'Terminer la configuration' : 'Continuer'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>

            {/* Skip notice */}
            <p className="text-center text-sm text-muted-foreground">
                💡 Vous pouvez configurer ces enregistrements plus tard depuis les Paramètres.
            </p>
        </div>
    );
}
