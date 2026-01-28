/**
 * Sequences Page
 * Story 4.1: Sequence Creation (Max 3 Steps) - AC6
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Layers,
    Sparkles,
    Plus,
    Zap,
    Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SequenceList } from '@/components/features/sequences/SequenceList';
import { useSequences, useDeleteSequence } from '@/hooks/use-sequences';
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
import type { SequenceListItem } from '@/types/sequence';

export default function SequencesPage() {
    const { data, isLoading, error } = useSequences();
    const deleteSequence = useDeleteSequence();

    // Hydration fix
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sequenceToDelete, setSequenceToDelete] = useState<SequenceListItem | null>(null);

    const handleDeleteClick = (sequence: SequenceListItem) => {
        setSequenceToDelete(sequence);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (sequenceToDelete) {
            deleteSequence.mutate(sequenceToDelete.id, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setSequenceToDelete(null);
                },
            });
        }
    };

    const sequences = data?.sequences ?? [];
    const isEmpty = !isLoading && sequences.length === 0;

    // Show skeleton if loading or not mounted yet (hydration mismatch prevention)
    if (!isMounted || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20">
                <div className="container max-w-7xl py-10 px-4 space-y-8">
                    {/* Header skeleton matching render */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 p-8 shadow-2xl shadow-teal-500/20">
                        <div className="h-full flex items-center">
                            <div className="animate-pulse bg-white/20 h-14 w-14 rounded-2xl mr-4"></div>
                            <div className="space-y-2">
                                <div className="animate-pulse bg-white/20 h-4 w-32 rounded"></div>
                                <div className="animate-pulse bg-white/20 h-8 w-48 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <SequenceList
                        sequences={[]}
                        isLoading={true}
                        onDelete={() => { }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20">
            <div className="container max-w-7xl py-10 px-4 space-y-8">
                {/* Header with gradient background */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 p-8 shadow-2xl shadow-teal-500/20">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-300/20 rounded-full blur-3xl" />

                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg">
                                <Layers className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                                    <Sparkles className="h-4 w-4" />
                                    <span>Email Sequences</span>
                                </div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">
                                    Séquences
                                </h1>
                                <p className="text-teal-100 mt-1">
                                    Créez et gérez vos séquences d&apos;emails automatisées
                                </p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3">
                            <Button
                                asChild
                                className="bg-white text-teal-600 hover:bg-white/90 shadow-lg shadow-teal-900/20"
                            >
                                <Link href="/sequences/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouvelle séquence
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Error state */}
                {error && (
                    <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                        <CardContent className="p-4">
                            <p className="text-red-600 dark:text-red-400">
                                Erreur lors du chargement: {error.message}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Empty state */}
                {isEmpty && (
                    <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
                        <CardContent className="p-12">
                            <div className="text-center space-y-6">
                                {/* Animated icon background */}
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                                    <div className="relative w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 rounded-full flex items-center justify-center">
                                        <Layers className="h-12 w-12 text-teal-500 dark:text-teal-400" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        Aucune séquence créée
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                        Commencez par créer votre première séquence d&apos;emails pour automatiser votre prospection.
                                    </p>
                                </div>

                                {/* CTA button */}
                                <div className="pt-4">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-500/30"
                                    >
                                        <Link href="/sequences/new">
                                            <Plus className="h-4 w-4" />
                                            Créer ma première séquence
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Sequence list */}
                {!isEmpty && (
                    <SequenceList
                        sequences={sequences}
                        isLoading={isLoading}
                        onDelete={handleDeleteClick}
                    />
                )}

                {/* Quick info cards when empty */}
                {isEmpty && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-0 shadow-lg shadow-slate-100 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 rounded-2xl flex items-center justify-center">
                                        <Mail className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">
                                            Jusqu&apos;à 3 étapes
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Créez des séquences avec jusqu&apos;à 3 emails de suivi personnalisés
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg shadow-slate-100 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 rounded-2xl flex items-center justify-center">
                                        <Zap className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">
                                            Personnalisation IA
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            L&apos;IA contextualise chaque email pour maximiser les réponses
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette séquence ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La séquence &quot;{sequenceToDelete?.name}&quot; et toutes ses étapes seront définitivement supprimées.
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
