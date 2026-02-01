'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GmailConnectStep } from './GmailConnectStep';
import { DnsConfigStep } from './DnsConfigStep';
import { GMAIL_DOMAINS } from '@/lib/constants/dns-providers';

interface OnboardingWizardProps {
    gmailConnected: boolean;
    gmailEmail?: string;
}

type OnboardingStep = 'gmail' | 'dns' | 'complete';

export function OnboardingWizard({ gmailConnected, gmailEmail }: OnboardingWizardProps) {
    const router = useRouter();

    // Check if user has a personal Gmail account (DNS is auto-managed by Google)
    const isPersonalGmail = gmailEmail
        ? GMAIL_DOMAINS.includes(gmailEmail.split('@')[1]?.toLowerCase() ?? '')
        : false;

    // Determine initial step based on completion status
    const getInitialStep = (): OnboardingStep => {
        if (!gmailConnected) return 'gmail';
        // For personal Gmail, DNS is auto-complete, go directly to DNS step (which shows success)
        return 'dns';
    };

    const [currentStep, setCurrentStep] = useState<OnboardingStep>(getInitialStep());

    // Auto-navigate to DNS step when Gmail becomes connected
    useEffect(() => {
        if (gmailConnected && currentStep === 'gmail') {
            setCurrentStep('dns');
        }
    }, [gmailConnected, currentStep]);

    const handleGmailNext = () => {
        setCurrentStep('dns');
    };

    const handleDnsComplete = () => {
        // Redirect to dashboard after DNS configuration is complete
        router.push('/dashboard');
    };

    // For personal Gmail accounts, DNS step is already complete
    const dnsStepCompleted = isPersonalGmail;

    const steps = [
        { id: 'gmail', label: 'Connecter Gmail', completed: gmailConnected },
        { id: 'dns', label: 'Configurer DNS', completed: dnsStepCompleted },
        { id: 'complete', label: 'Prêt !', completed: false },
    ];

    // Determine which step to highlight as active
    const getActiveStep = (): OnboardingStep => {
        if (!gmailConnected) return 'gmail';
        // For personal Gmail with DNS auto-complete, show "Prêt !" as active since they're done
        if (isPersonalGmail) return 'complete';
        return 'dns';
    };

    const activeStep = getActiveStep();

    return (
        <div className="space-y-8">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
                                ${step.completed ? 'bg-primary text-primary-foreground' :
                                    activeStep === step.id ? 'bg-primary text-primary-foreground' :
                                        'bg-muted text-muted-foreground'}
                            `}
                        >
                            {step.completed ? '✓' : index + 1}
                        </div>
                        <span className={`ml-2 text-sm hidden sm:inline
                            ${activeStep === step.id ? 'font-medium' : 'text-muted-foreground'}
                        `}>
                            {step.label}
                        </span>
                        {index < steps.length - 1 && (
                            <div className="w-8 sm:w-12 h-px bg-border mx-2 sm:mx-4" />
                        )}
                    </div>
                ))}
            </div>

            {/* Step content */}
            {currentStep === 'gmail' && (
                <GmailConnectStep
                    isConnected={gmailConnected}
                    connectedEmail={gmailEmail}
                    onNext={handleGmailNext}
                />
            )}

            {currentStep === 'dns' && (
                <DnsConfigStep onComplete={handleDnsComplete} />
            )}
        </div>
    );
}
