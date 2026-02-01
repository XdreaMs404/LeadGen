'use client';

import { useState } from 'react';
import { useCampaigns, useCreateCampaign, useDeleteCampaign } from '@/hooks/use-campaigns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CampaignLaunchWizard } from '@/components/features/campaigns/CampaignLaunchWizard';
import { Plus, Rocket, Trash2, Play, Pause, CheckCircle, XCircle, Loader2, Sparkles, Users, TrendingUp } from 'lucide-react';
import { CampaignStatus } from '@/types/campaign';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
    DRAFT: {
        label: 'Brouillon',
        color: 'text-slate-600',
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        icon: Rocket
    },
    RUNNING: {
        label: 'En cours',
        color: 'text-emerald-600',
        bgColor: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        icon: Play
    },
    PAUSED: {
        label: 'En pause',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/50',
        icon: Pause
    },
    COMPLETED: {
        label: 'Terminée',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/50',
        icon: CheckCircle
    },
    STOPPED: {
        label: 'Arrêtée',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/50',
        icon: XCircle
    },
};

export default function CampaignsPage() {
    const { data, isLoading } = useCampaigns();
    const createCampaign = useCreateCampaign();
    const deleteCampaign = useDeleteCampaign();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState('');

    const [launchWizardCampaignId, setLaunchWizardCampaignId] = useState<string | null>(null);
    const [deleteDialogCampaignId, setDeleteDialogCampaignId] = useState<string | null>(null);

    const handleCreateCampaign = async () => {
        if (!newCampaignName.trim()) return;

        await createCampaign.mutateAsync({
            name: newCampaignName.trim(),
            // No sequenceId - it will be selected in the launch wizard
        });

        setNewCampaignName('');
        setCreateDialogOpen(false);
    };

    const handleDeleteCampaign = async () => {
        if (!deleteDialogCampaignId) return;
        await deleteCampaign.mutateAsync(deleteDialogCampaignId);
        setDeleteDialogCampaignId(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="container mx-auto py-8 px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-12 w-48 rounded-xl" />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-64 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const campaigns = data?.campaigns || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="container mx-auto py-8 px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                            Campagnes
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Gérez et lancez vos campagnes d&apos;emailing
                        </p>
                    </div>

                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300 rounded-xl px-6"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Nouvelle campagne
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl border-0 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl">Créer une campagne</DialogTitle>
                                <DialogDescription>
                                    Donnez un nom à votre campagne. Vous sélectionnerez la séquence et les prospects lors du lancement.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom de la campagne</Label>
                                    <Input
                                        id="name"
                                        value={newCampaignName}
                                        onChange={(e) => setNewCampaignName(e.target.value)}
                                        placeholder="Ex: Prospection Q1 2024"
                                        className="rounded-xl"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newCampaignName.trim()) {
                                                handleCreateCampaign();
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-xl">
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleCreateCampaign}
                                    disabled={!newCampaignName.trim() || createCampaign.isPending}
                                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl"
                                >
                                    {createCampaign.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Créer
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Empty state */}
                {campaigns.length === 0 ? (
                    <Card className="border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 shadow-none rounded-2xl">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 flex items-center justify-center mb-6">
                                <Rocket className="h-12 w-12 text-teal-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Aucune campagne
                            </h3>
                            <p className="text-slate-500 text-center max-w-md mb-6">
                                Créez votre première campagne pour commencer à envoyer des emails personnalisés à vos prospects.
                            </p>
                            <Button
                                onClick={() => setCreateDialogOpen(true)}
                                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-500/25 rounded-xl px-6"
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Créer ma première campagne
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.map(campaign => {
                            const statusConfig = STATUS_CONFIG[campaign.status];
                            const StatusIcon = statusConfig.icon;
                            const isRunning = campaign.status === 'RUNNING';

                            return (
                                <Card
                                    key={campaign.id}
                                    className={cn(
                                        'group relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300',
                                        'bg-white dark:bg-slate-900',
                                        isRunning && 'ring-2 ring-emerald-500/20'
                                    )}
                                >
                                    {/* Status ribbon for running campaigns */}
                                    {isRunning && (
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                                    )}

                                    <CardContent className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-lg text-slate-900 dark:text-white truncate mb-1">
                                                    {campaign.name}
                                                </h3>
                                                <p className="text-sm text-slate-500 truncate">
                                                    {campaign.sequence?.name || 'Séquence non définie'}
                                                </p>
                                            </div>
                                            <Badge
                                                className={cn(
                                                    'flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-xs border-0',
                                                    statusConfig.bgColor,
                                                    campaign.status === 'RUNNING' ? 'text-white' : statusConfig.color
                                                )}
                                            >
                                                <StatusIcon className="h-3 w-3" />
                                                {statusConfig.label}
                                            </Badge>
                                        </div>

                                        {/* Stats */}
                                        {campaign.enrollmentCounts && campaign.enrollmentCounts.total > 0 && (
                                            <div className="grid grid-cols-3 gap-3 mb-6">
                                                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                    <div className="flex items-center justify-center gap-1 mb-1">
                                                        <Users className="h-3.5 w-3.5 text-slate-400" />
                                                    </div>
                                                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                                                        {campaign.enrollmentCounts.total}
                                                    </div>
                                                    <div className="text-[10px] uppercase tracking-wide text-slate-500">
                                                        Prospects
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                                                    <div className="flex items-center justify-center gap-1 mb-1">
                                                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                                    </div>
                                                    <div className="text-lg font-bold text-green-600">
                                                        {campaign.enrollmentCounts.replied}
                                                    </div>
                                                    <div className="text-[10px] uppercase tracking-wide text-green-600/70">
                                                        Réponses
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                                                    <div className="flex items-center justify-center gap-1 mb-1">
                                                        <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                                                    </div>
                                                    <div className="text-lg font-bold text-blue-600">
                                                        {campaign.enrollmentCounts.completed}
                                                    </div>
                                                    <div className="text-[10px] uppercase tracking-wide text-blue-600/70">
                                                        Terminés
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {campaign.status === 'DRAFT' && (
                                                <>
                                                    <Button
                                                        className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/20 rounded-xl"
                                                        onClick={() => setLaunchWizardCampaignId(campaign.id)}
                                                    >
                                                        <Rocket className="h-4 w-4 mr-2" />
                                                        Lancer
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                                        onClick={() => setDeleteDialogCampaignId(campaign.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                            {campaign.status === 'RUNNING' && (
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50"
                                                    disabled
                                                >
                                                    <Pause className="h-4 w-4 mr-2" />
                                                    Mettre en pause
                                                </Button>
                                            )}
                                            {campaign.status === 'PAUSED' && (
                                                <Button className="flex-1 rounded-xl" disabled>
                                                    <Play className="h-4 w-4 mr-2" />
                                                    Reprendre
                                                </Button>
                                            )}
                                            {campaign.status === 'COMPLETED' && (
                                                <div className="flex-1 flex items-center justify-center gap-2 text-blue-600 text-sm font-medium p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Campagne terminée
                                                </div>
                                            )}
                                            {campaign.status === 'STOPPED' && (
                                                <div className="flex-1 flex items-center justify-center gap-2 text-red-600 text-sm font-medium p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
                                                    <XCircle className="h-4 w-4" />
                                                    Campagne arrêtée
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Launch Wizard Dialog */}
                {launchWizardCampaignId && (
                    <CampaignLaunchWizard
                        campaignId={launchWizardCampaignId}
                        open={!!launchWizardCampaignId}
                        onOpenChange={(open) => !open && setLaunchWizardCampaignId(null)}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={!!deleteDialogCampaignId} onOpenChange={(open) => !open && setDeleteDialogCampaignId(null)}>
                    <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer la campagne ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. La campagne et toutes ses données seront définitivement supprimées.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteCampaign}
                                className="bg-red-600 hover:bg-red-700 rounded-xl"
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
