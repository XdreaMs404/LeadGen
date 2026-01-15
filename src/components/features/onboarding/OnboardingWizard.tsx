'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GmailConnectStep } from './GmailConnectStep';
import { DnsConfigStep } from './DnsConfigStep';

interface OnboardingWizardProps {
    gmailConnected: boolean;
    gmailEmail?: string;
}

type OnboardingStep = 'gmail' | 'dns' | 'complete';

export function OnboardingWizard({ gmailConnected, gmailEmail }: OnboardingWizardProps) {
    const router = useRouter();

    // Determine initial step based on completion status
    const getInitialStep = (): OnboardingStep => {
        if (!gmailConnected) return 'gmail';
        return 'dns'; // Navigate to DNS step when Gmail is connected
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
        router.push('/');
    };

    const steps = [
        { id: 'gmail', label: 'Connecter Gmail', completed: gmailConnected },
        { id: 'dns', label: 'Configurer DNS', completed: false },
        { id: 'complete', label: 'Prêt !', completed: false },
    ];

    return (
        <div className="space-y-8">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
                                ${step.completed ? 'bg-primary text-primary-foreground' :
                                    currentStep === step.id ? 'bg-primary text-primary-foreground' :
                                        'bg-muted text-muted-foreground'}
                            `}
                        >
                            {step.completed ? '✓' : index + 1}
                        </div>
                        <span className={`ml-2 text-sm hidden sm:inline
                            ${currentStep === step.id ? 'font-medium' : 'text-muted-foreground'}
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
