'use client';

import { useOnboardingStatus } from '@/hooks/use-onboarding-status';
import { OnboardingProgressCard } from './OnboardingProgressCard';
import { OnboardingSuccessCard } from './OnboardingSuccessCard';
import { Card, CardContent } from '@/components/ui/card';
import type { DnsStatus } from '@/types/dns';
import { motion } from 'framer-motion';

/**
 * DashboardOnboardingSection - Client component that shows either progress or success card
 */
export function DashboardOnboardingSection() {
    const {
        isLoading,
        gmailConnected,
        spfStatus,
        dkimStatus,
        dmarcStatus,
        onboardingComplete,
        progressPercent,
    } = useOnboardingStatus();

    if (isLoading) {
        return (
            <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                <CardContent className="p-6">
                    {/* Skeleton with shimmer effect */}
                    <div className="animate-pulse space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-slate-700/50" />
                                <div className="space-y-2">
                                    <div className="h-4 w-40 rounded bg-slate-700/50" />
                                    <div className="h-3 w-28 rounded bg-slate-700/30" />
                                </div>
                            </div>
                            <div className="h-10 w-16 rounded-full bg-slate-700/50" />
                        </div>
                        <div className="h-2 rounded-full bg-slate-700/50" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-16 rounded-xl bg-slate-700/30" />
                            ))}
                        </div>
                        <div className="h-12 rounded-lg bg-slate-700/50" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (onboardingComplete) {
        return <OnboardingSuccessCard />;
    }

    return (
        <OnboardingProgressCard
            gmailConnected={gmailConnected}
            spfStatus={spfStatus as DnsStatus}
            dkimStatus={dkimStatus as DnsStatus}
            dmarcStatus={dmarcStatus as DnsStatus}
            progressPercent={progressPercent}
        />
    );
}
