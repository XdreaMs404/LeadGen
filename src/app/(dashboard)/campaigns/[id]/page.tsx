'use client';

/**
 * Campaign Detail Page
 * Story 5.6: Campaign Control (Pause/Resume/Stop Global)
 * Story 5.7: Individual Lead Control within Campaign
 * 
 * Displays campaign details, stats, control bar, and enrolled prospects.
 * Premium design with gradient accents and modern card styling.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCampaign, useDeleteCampaign } from '@/hooks/use-campaigns';
import { useWorkspace } from '@/hooks/use-workspace';
import { CampaignControlBar } from '@/components/features/campaigns/CampaignControlBar';
import { CampaignStatusBadge } from '@/components/features/campaigns/CampaignStatusBadge';
import { CampaignProspectsList } from '@/components/features/campaigns/CampaignProspectsList';
import { AutoPauseBanner } from '@/components/features/campaigns/AutoPauseBanner';
import { useUpdateCampaignStatus } from '@/hooks/use-campaigns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/alert-dialog';
import {
    ArrowLeft,
    Send,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    MessageSquare,
    Users,
    Calendar,
    Trash2,
    Loader2,
} from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function CampaignDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { workspaceId } = useWorkspace();
    const campaignId = params.id as string;
    const deleteCampaign = useDeleteCampaign();
    const updateStatus = useUpdateCampaignStatus();

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isResuming, setIsResuming] = useState(false);

    const { data: campaign, isLoading, error } = useCampaign(campaignId);

    const handleDelete = async () => {
        await deleteCampaign.mutateAsync(campaignId);
        setIsDeleteDialogOpen(false);
        router.push('/campaigns');
    };

    // Story 5.8: Handle resume with acknowledgment for auto-paused campaigns
    const handleResumeWithAcknowledgment = async (acknowledgeRisk: boolean) => {
        setIsResuming(true);
        try {
            await updateStatus.mutateAsync({
                campaignId,
                action: 'resume',
                acknowledgeRisk,
            });
        } finally {
            setIsResuming(false);
        }
    };

    if (isLoading) {
        return <CampaignDetailSkeleton />;
    }

    if (error || !campaign) {
        if (error?.message?.includes('not found')) {
            notFound();
        }
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 dark:text-red-400 font-medium">
                        Une erreur est survenue lors du chargement de la campagne.
                    </p>
                </div>
            </div>
        );
    }

    // Real stats from API
    const stats = campaign.stats || { sent: 0, replied: 0, bounced: 0, scheduled: 0, cancelled: 0 };
    const enrollmentCounts = campaign.enrollmentCounts || { total: 0, enrolled: 0, completed: 0, replied: 0, paused: 0, stopped: 0 };

    const isActive = campaign.status === 'RUNNING';
    const isPaused = campaign.status === 'PAUSED';
    const isStopped = campaign.status === 'STOPPED';
    const isCompleted = campaign.status === 'COMPLETED';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="container mx-auto py-8 px-4 space-y-8">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push('/campaigns')}
                            className="rounded-xl shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                                    {campaign.name}
                                </h1>
                                <CampaignStatusBadge
                                    status={campaign.status}
                                    pausedAt={campaign.pausedAt}
                                    stoppedAt={campaign.stoppedAt}
                                />
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Créée le {new Date(campaign.createdAt).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                                {campaign.sequence && (
                                    <Link
                                        href={`/sequences/${campaign.sequenceId}/edit`}
                                        className="flex items-center gap-1.5 hover:text-teal-600 transition-colors"
                                    >
                                        <Send className="h-4 w-4" />
                                        {campaign.sequence.name}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Control Bar & Actions */}
                    <div className="flex items-center gap-3">
                        <CampaignControlBar
                            campaignId={campaign.id}
                            status={campaign.status}
                            pendingEmailsCount={stats.scheduled}
                            onDelete={() => setIsDeleteDialogOpen(true)}
                        />
                    </div>
                </div>

                {/* Story 5.8: Auto-Pause Banner */}
                {campaign.autoPausedReason && (
                    <AutoPauseBanner
                        autoPausedReason={campaign.autoPausedReason}
                        bounceRate={stats.bounced > 0 && stats.sent > 0 ? (stats.bounced / stats.sent) * 100 : undefined}
                        onResume={handleResumeWithAcknowledgment}
                        isResuming={isResuming}
                    />
                )}

                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Emails envoyés"
                        value={stats.sent}
                        icon={Send}
                        gradient="from-blue-500 to-cyan-500"
                        bgGradient="from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"
                    />
                    <StatsCard
                        title="Réponses"
                        value={stats.replied}
                        icon={MessageSquare}
                        gradient="from-emerald-500 to-green-500"
                        bgGradient="from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30"
                        highlight
                    />
                    <StatsCard
                        title="Bloqués"
                        value={stats.bounced}
                        icon={XCircle}
                        gradient="from-red-500 to-rose-500"
                        bgGradient="from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30"
                        variant="error"
                    />
                    <StatsCard
                        title={isStopped ? 'Annulés' : 'En attente'}
                        value={isStopped ? stats.cancelled : stats.scheduled}
                        icon={isStopped ? XCircle : Clock}
                        gradient="from-amber-500 to-orange-500"
                        bgGradient="from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
                    />
                </div>

                {/* Enrollment Overview */}
                <Card className="rounded-2xl border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
                    <div className={cn(
                        "h-1",
                        isActive && "bg-gradient-to-r from-emerald-500 to-teal-500",
                        isPaused && "bg-gradient-to-r from-amber-400 to-orange-400",
                        isStopped && "bg-gradient-to-r from-red-400 to-rose-400",
                        isCompleted && "bg-gradient-to-r from-blue-400 to-cyan-400"
                    )} />
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5 text-slate-500" />
                                Aperçu des inscriptions
                            </CardTitle>
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                {enrollmentCounts.total} <span className="text-sm font-normal text-slate-500">prospects</span>
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <EnrollmentStat
                                label="Actifs"
                                value={enrollmentCounts.enrolled}
                                color="text-emerald-600"
                                bgColor="bg-emerald-100 dark:bg-emerald-900/30"
                            />
                            <EnrollmentStat
                                label="Terminés"
                                value={enrollmentCounts.completed}
                                color="text-blue-600"
                                bgColor="bg-blue-100 dark:bg-blue-900/30"
                            />
                            <EnrollmentStat
                                label="Répondu"
                                value={enrollmentCounts.replied}
                                color="text-teal-600"
                                bgColor="bg-teal-100 dark:bg-teal-900/30"
                            />
                            <EnrollmentStat
                                label="En pause"
                                value={enrollmentCounts.paused}
                                color="text-amber-600"
                                bgColor="bg-amber-100 dark:bg-amber-900/30"
                            />
                            <EnrollmentStat
                                label="Stoppés"
                                value={enrollmentCounts.stopped}
                                color="text-red-600"
                                bgColor="bg-red-100 dark:bg-red-900/30"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Enrolled Prospects List (Story 5.7) */}
                <Card className="rounded-2xl border-0 shadow-lg bg-white dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-teal-500" />
                            Prospects inscrits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <CampaignProspectsList
                            campaignId={campaign.id}
                            campaignStatus={campaign.status}
                        />
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette campagne ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. La campagne "{campaign.name}" et toutes ses données
                                seront définitivement supprimées.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 rounded-xl"
                                disabled={deleteCampaign.isPending}
                            >
                                {deleteCampaign.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

// ===== Sub-components =====

interface StatsCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    gradient: string;
    bgGradient: string;
    variant?: 'default' | 'error';
    highlight?: boolean;
}

function StatsCard({ title, value, icon: Icon, gradient, bgGradient, variant, highlight }: StatsCardProps) {
    return (
        <Card className={cn(
            "rounded-2xl border-0 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl",
            `bg-gradient-to-br ${bgGradient}`
        )}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        `bg-gradient-to-br ${gradient}`
                    )}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                    {highlight && value > 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-emerald-500 text-white rounded-full">
                            +{value}
                        </span>
                    )}
                </div>
                <div className={cn(
                    "text-3xl font-bold mb-1",
                    variant === 'error' && value > 0 ? "text-red-600" : "text-slate-900 dark:text-white"
                )}>
                    {value}
                </div>
                <div className="text-sm text-slate-500">{title}</div>
            </CardContent>
        </Card>
    );
}

interface EnrollmentStatProps {
    label: string;
    value: number;
    color: string;
    bgColor: string;
}

function EnrollmentStat({ label, value, color, bgColor }: EnrollmentStatProps) {
    return (
        <div className={cn("rounded-xl p-4 text-center", bgColor)}>
            <div className={cn("text-2xl font-bold", color)}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
        </div>
    );
}

function CampaignDetailSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="container mx-auto py-8 px-4 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
                {/* Enrollment Overview */}
                <Skeleton className="h-40 rounded-2xl" />
                {/* Prospects List */}
                <Skeleton className="h-96 rounded-2xl" />
            </div>
        </div>
    );
}
