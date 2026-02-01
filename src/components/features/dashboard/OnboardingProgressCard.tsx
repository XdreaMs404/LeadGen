'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DnsStatusBadge } from '@/components/shared/DnsStatusBadge';
import { CheckCircle2, Circle, Mail, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import type { DnsStatus } from '@/types/dns';
import { motion } from 'framer-motion';

interface OnboardingProgressCardProps {
    gmailConnected: boolean;
    spfStatus: DnsStatus;
    dkimStatus: DnsStatus;
    dmarcStatus: DnsStatus;
    progressPercent: number;
}

const isComplete = (status: DnsStatus) => status === 'PASS' || status === 'MANUAL_OVERRIDE';

/**
 * OnboardingProgressCard - Premium design onboarding checklist
 */
export function OnboardingProgressCard({
    gmailConnected,
    spfStatus,
    dkimStatus,
    dmarcStatus,
    progressPercent,
}: OnboardingProgressCardProps) {
    const steps = [
        {
            label: 'Connexion Gmail',
            done: gmailConnected,
            icon: Mail,
            description: 'Liez votre compte Google'
        },
        {
            label: 'SPF',
            done: isComplete(spfStatus),
            status: spfStatus,
            icon: Shield,
            description: 'Sender Policy Framework'
        },
        {
            label: 'DKIM',
            done: isComplete(dkimStatus),
            status: dkimStatus,
            icon: Shield,
            description: 'DomainKeys Identified Mail'
        },
        {
            label: 'DMARC',
            done: isComplete(dmarcStatus),
            status: dmarcStatus,
            icon: Shield,
            description: 'Domain-based Authentication'
        },
    ];

    const completedSteps = steps.filter(s => s.done).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card
                className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl"
                data-testid="onboarding-progress-card"
            >
                {/* Background decorations */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/20 to-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/15 to-teal-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

                <CardContent className="relative z-10 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-500/30">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Configuration requise</h3>
                                <p className="text-sm text-slate-400">Pour garantir la délivrabilité</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2">
                            <span className="text-2xl font-bold text-teal-400">{completedSteps}</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-lg text-slate-300">4</span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Progression</span>
                            <span className="font-medium text-teal-400">{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3 mb-6">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={step.label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${step.done
                                        ? 'bg-teal-500/10 border border-teal-500/20'
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${step.done
                                            ? 'bg-teal-500/20 text-teal-400'
                                            : 'bg-slate-700/50 text-slate-400'
                                            }`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${step.done ? 'text-white' : 'text-slate-300'}`}>
                                                {step.label}
                                            </p>
                                            <p className="text-xs text-slate-500">{step.description}</p>
                                        </div>
                                    </div>

                                    {step.done ? (
                                        <div className="flex items-center gap-1.5 text-teal-400">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="text-xs font-medium">Vérifié</span>
                                        </div>
                                    ) : step.status ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <DnsStatusBadge status={step.status} />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Cliquez pour configurer</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            <Circle className="h-4 w-4" />
                                            <span className="text-xs">En attente</span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* CTA Button */}
                    <Button
                        asChild
                        className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-teal-500/25 border-0 transition-all hover:shadow-xl hover:shadow-teal-500/30"
                    >
                        <Link href="/onboarding" className="flex items-center justify-center gap-2">
                            Continuer la configuration
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
