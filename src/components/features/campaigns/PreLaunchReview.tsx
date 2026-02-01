'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/hooks/use-workspace';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2, Shield, Mail, Layers, Users, Sparkles, AlertTriangle } from 'lucide-react';
import type { ApiResponse } from '@/lib/utils/api-response';
import type { PreLaunchCheckResult } from '@/lib/guardrails/pre-launch-check';

interface PreLaunchReviewProps {
    sequenceId: string | null;
    prospectIds: string[];
    onCheckComplete: (canLaunch: boolean) => void;
}

interface CheckItemProps {
    icon: React.ElementType;
    label: string;
    description: string;
    status: 'loading' | 'passed' | 'warning' | 'failed';
    message?: string;
}

function CheckItem({ icon: Icon, label, description, status, message }: CheckItemProps) {
    const isPassed = status === 'passed';
    const isWarning = status === 'warning';
    const isFailed = status === 'failed';
    const isLoading = status === 'loading';

    return (
        <div className={cn(
            'relative overflow-hidden rounded-xl border-2 p-5 transition-all duration-300',
            isPassed && 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800',
            isWarning && 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800',
            isFailed && 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 dark:border-red-800',
            isLoading && 'border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/50'
        )}>
            {/* Background decoration */}
            {isPassed && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            )}

            <div className="relative flex items-start gap-4">
                {/* Icon container */}
                <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
                    isPassed && 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25',
                    isWarning && 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/25',
                    isFailed && 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/25',
                    isLoading && 'bg-slate-200 dark:bg-slate-700'
                )}>
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 text-slate-500 animate-spin" />
                    ) : isPassed ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : isWarning ? (
                        <AlertTriangle className="h-5 w-5 text-white" />
                    ) : (
                        <XCircle className="h-5 w-5 text-white" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Icon className={cn(
                            'h-4 w-4',
                            isPassed && 'text-green-600',
                            isWarning && 'text-amber-600',
                            isFailed && 'text-red-600',
                            isLoading && 'text-slate-400'
                        )} />
                        <p className={cn(
                            'font-semibold',
                            isPassed && 'text-green-800 dark:text-green-300',
                            isWarning && 'text-amber-800 dark:text-amber-300',
                            isFailed && 'text-red-800 dark:text-red-300',
                            isLoading && 'text-slate-600 dark:text-slate-400'
                        )}>
                            {label}
                        </p>
                    </div>
                    <p className={cn(
                        'text-sm',
                        isPassed && 'text-green-700/80 dark:text-green-400/80',
                        isWarning && 'text-amber-700/80 dark:text-amber-400/80',
                        isFailed && 'text-red-700/80 dark:text-red-400/80',
                        isLoading && 'text-slate-500'
                    )}>
                        {description}
                    </p>
                    {message && (
                        <p className={cn(
                            'text-sm mt-2 flex items-start gap-1.5',
                            isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                        )}>
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            {message}
                        </p>
                    )}
                </div>

                {/* Status badge */}
                <Badge
                    variant="outline"
                    className={cn(
                        'flex-shrink-0 rounded-full px-3 font-semibold text-xs',
                        isPassed && 'border-green-300 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-900/50 dark:text-green-300',
                        isWarning && 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
                        isFailed && 'border-red-300 bg-red-100 text-red-700 dark:border-red-700 dark:bg-red-900/50 dark:text-red-300',
                        isLoading && 'border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    )}
                >
                    {isLoading ? 'En cours...' : isPassed ? '✓ OK' : isWarning ? '⚠ Attention' : '✗ Échec'}
                </Badge>
            </div>
        </div>
    );
}

/**
 * PreLaunchReview Component - Story 5.2 (AC4)
 * Premium redesign with visual checks and summary card
 */
export function PreLaunchReview({ sequenceId, prospectIds, onCheckComplete }: PreLaunchReviewProps) {
    const { workspaceId } = useWorkspace();

    const { data, isLoading, error } = useQuery({
        queryKey: ['pre-launch-check', workspaceId, sequenceId, prospectIds.length],
        queryFn: async (): Promise<PreLaunchCheckResult> => {
            const res = await fetch('/api/campaigns/pre-launch-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sequenceId, prospectIds }),
            });
            const json: ApiResponse<PreLaunchCheckResult> = await res.json();
            if (!json.success) {
                throw new Error(json.error.message);
            }
            return json.data;
        },
        enabled: !!workspaceId && !!sequenceId && prospectIds.length > 0,
    });

    useEffect(() => {
        if (data) {
            onCheckComplete(data.canLaunch);
        }
    }, [data, onCheckComplete]);

    const getIssueMessage = (code: string): string | undefined => {
        return data?.issues.find(i => i.code === code)?.message ||
            data?.warnings?.find(i => i.code === code)?.message;
    };

    const issueCodes = data?.issues.map(i => i.code) || [];
    const warningCodes = data?.warnings?.map(w => w.code) || [];
    const hasUnverifiedWarning = warningCodes.includes('UNVERIFIED_PROSPECTS');

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div>
                        <Skeleton className="h-5 w-48 mb-1" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/50 dark:to-rose-900/50 flex items-center justify-center mb-4">
                    <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-red-600 font-medium mb-2">Erreur lors de la vérification</p>
                <p className="text-sm text-slate-500">{error.message}</p>
            </div>
        );
    }

    const checkStatuses = {
        onboarding: !issueCodes.includes('ONBOARDING_INCOMPLETE'),
        gmail: !issueCodes.includes('GMAIL_NOT_CONNECTED') && !issueCodes.includes('GMAIL_TOKEN_INVALID'),
        sequence: !issueCodes.includes('SEQUENCE_NOT_READY'),
        // Prospects are OK if no error (NO_PROSPECTS_SELECTED, PROSPECTS_NOT_FOUND)
        // But may have a warning for unverified
        prospects: !issueCodes.includes('NO_PROSPECTS_SELECTED') && !issueCodes.includes('PROSPECTS_NOT_FOUND'),
    };

    const passedCount = Object.values(checkStatuses).filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
                    <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Vérification pré-lancement
                    </h3>
                    <p className="text-sm text-slate-500">
                        Toutes les conditions doivent être remplies pour lancer
                    </p>
                </div>
                <Badge
                    variant="outline"
                    className={cn(
                        'rounded-full px-3 py-1 font-semibold',
                        passedCount === 4
                            ? 'bg-green-100 border-green-300 text-green-700'
                            : 'bg-amber-100 border-amber-300 text-amber-700'
                    )}
                >
                    {passedCount}/4 validé{passedCount > 1 ? 's' : ''}
                </Badge>
            </div>

            {/* Check items */}
            <div className="space-y-3">
                <CheckItem
                    icon={Shield}
                    label="Configuration livrabilité"
                    description="SPF, DKIM et DMARC correctement configurés"
                    status={!data ? 'loading' : checkStatuses.onboarding ? 'passed' : 'failed'}
                    message={getIssueMessage('ONBOARDING_INCOMPLETE')}
                />
                <CheckItem
                    icon={Mail}
                    label="Connexion Gmail"
                    description="Compte Gmail connecté avec un token valide"
                    status={!data ? 'loading' : checkStatuses.gmail ? 'passed' : 'failed'}
                    message={getIssueMessage('GMAIL_NOT_CONNECTED') || getIssueMessage('GMAIL_TOKEN_INVALID')}
                />
                <CheckItem
                    icon={Layers}
                    label="Séquence validée"
                    description="Séquence prête avec aperçu copilot complété"
                    status={!data ? 'loading' : checkStatuses.sequence ? 'passed' : 'failed'}
                    message={getIssueMessage('SEQUENCE_NOT_READY')}
                />
                <CheckItem
                    icon={Users}
                    label="Prospects sélectionnés"
                    description={hasUnverifiedWarning ? 'Certains prospects ne sont pas vérifiés' : 'Tous les prospects sélectionnés sont vérifiés'}
                    status={!data ? 'loading' : !checkStatuses.prospects ? 'failed' : hasUnverifiedWarning ? 'warning' : 'passed'}
                    message={getIssueMessage('NO_PROSPECTS_SELECTED') || getIssueMessage('PROSPECTS_NOT_FOUND') || getIssueMessage('UNVERIFIED_PROSPECTS')}
                />
            </div>

            {/* Summary card */}
            <div className={cn(
                'relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-500',
                data?.canLaunch
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/25'
                    : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-2 border-amber-200 dark:border-amber-800'
            )}>
                {/* Decorative elements */}
                {data?.canLaunch && (
                    <>
                        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
                    </>
                )}

                <div className="relative">
                    {data?.canLaunch ? (
                        <>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Sparkles className="h-8 w-8 text-white" />
                            </div>
                            <p className="text-xl font-bold mb-2">
                                Prêt pour le lancement ! 🚀
                            </p>
                            <p className="text-white/80 text-sm">
                                Toutes les conditions sont remplies. Cliquez sur &quot;Lancer la campagne&quot; pour commencer.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-amber-600" />
                            </div>
                            <p className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">
                                Action requise
                            </p>
                            <p className="text-amber-700 dark:text-amber-300 text-sm">
                                Corrigez les problèmes ci-dessus avant de pouvoir lancer la campagne.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
