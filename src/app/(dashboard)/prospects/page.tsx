/**
 * Prospects Page - Client Component
 * Story 3.4: Prospect List & Status Display with Filters
 * Story 3.6: Prospect Deletion with Cascade
 */
'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    Sparkles,
    Upload,
    UserPlus,
    TrendingUp,
    Target,
    FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AddProspectDialog } from '@/components/features/prospects/AddProspectDialog';
import { ProspectTable } from '@/components/features/prospects/ProspectTable';
import { ProspectFilters } from '@/components/features/prospects/ProspectFilters';
import { ProspectPagination } from '@/components/features/prospects/ProspectPagination';
import { ProspectDetailSheet } from '@/components/features/prospects/ProspectDetailSheet';
import { DeleteProspectDialog } from '@/components/features/prospects/DeleteProspectDialog';
import { BulkActionBar } from '@/components/features/prospects/BulkActionBar';
import { useProspects } from '@/hooks/use-prospects';
import { useProspectFilters } from '@/hooks/use-prospect-filters';
import { useReEnrich } from '@/hooks/use-enrichment';
import { useWorkspace } from '@/hooks/use-workspace';
import type { Prospect } from '@/types/prospect';

/**
 * Main content component - needs Suspense for useSearchParams
 */
function ProspectsContent() {
    const { filters, setFilters, resetFilters, setPage, setPageSize, setSearch } = useProspectFilters();

    // Fetch prospects with current filters
    const { data, isLoading, error } = useProspects({
        page: filters.page,
        pageSize: filters.pageSize,
        search: filters.search || undefined,
        status: filters.status.length > 0 ? filters.status : undefined,
        source: filters.source.length > 0 ? filters.source : undefined,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
    });

    // Detail sheet state
    const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Selection state (Story 3.6)
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Delete dialog state (Story 3.6)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [prospectToDelete, setProspectToDelete] = useState<Prospect | null>(null);

    // Re-enrich mutation
    const { workspaceId } = useWorkspace();
    const { mutate: reEnrich } = useReEnrich(workspaceId || '');

    const handleRowClick = (prospect: Prospect) => {
        setSelectedProspect(prospect);
        setDetailOpen(true);
    };

    // Delete handlers (Story 3.6)
    const handleDeleteClick = (prospect: Prospect) => {
        setProspectToDelete(prospect);
        setDeleteDialogOpen(true);
    };

    const handleReEnrichClick = (prospect: Prospect) => {
        reEnrich(prospect.id);
    };



    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    const handleDeleteSuccess = () => {
        setSelectedIds([]);
    };

    // Fix hydration error by mounting client-side only
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const prospects = data?.prospects ?? [];
    const total = data?.total ?? 0;
    const isEmpty = !isLoading && prospects.length === 0 && !filters.search && filters.status.length === 0 && filters.source.length === 0;

    // Prevent hydration mismatch
    if (!isMounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20">
            <div className="container max-w-7xl py-10 px-4 space-y-8">
                {/* Header with gradient background */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 shadow-2xl shadow-violet-500/20">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl" />

                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg">
                                <Users className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                                    <Sparkles className="h-4 w-4" />
                                    <span>Gestion des prospects</span>
                                </div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">
                                    Prospects
                                </h1>
                                <p className="text-violet-100 mt-1">
                                    Gérez et enrichissez vos contacts de prospection
                                </p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                asChild
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                            >
                                <Link href="/prospects/import">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Importer CSV
                                </Link>
                            </Button>
                            <AddProspectDialog
                                trigger={
                                    <Button className="bg-white text-violet-600 hover:bg-white/90 shadow-lg shadow-violet-900/20">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Ajouter un prospect
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-lg shadow-slate-100 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total prospects</p>
                                    <p className="text-3xl font-bold">{total}</p>
                                </div>
                                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/50 rounded-xl flex items-center justify-center">
                                    <Users className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                <span>Dans votre base</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg shadow-slate-100 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Nouveaux</p>
                                    <p className="text-3xl font-bold">—</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                                    <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <Sparkles className="h-3 w-3" />
                                <span>En attente d&apos;action</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg shadow-slate-100 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Vérifiés</p>
                                    <p className="text-3xl font-bold">—</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                                    <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                <span>Prêts à contacter</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg shadow-slate-100 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Contactés</p>
                                    <p className="text-3xl font-bold">—</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <Sparkles className="h-3 w-3" />
                                <span>En séquence</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Table */}
                {isEmpty ? (
                    /* Empty state - Premium design */
                    <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
                        <CardContent className="p-12">
                            <div className="text-center space-y-6">
                                {/* Animated icon background */}
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                                    <div className="relative w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center">
                                        <Users className="h-12 w-12 text-violet-500 dark:text-violet-400" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        Aucun prospect pour l&apos;instant
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                        Commencez par importer vos contacts ou ajoutez-les manuellement pour démarrer votre prospection.
                                    </p>
                                </div>

                                {/* CTA buttons */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30"
                                    >
                                        <Link href="/prospects/import">
                                            <Upload className="h-4 w-4" />
                                            Importer un fichier CSV
                                        </Link>
                                    </Button>
                                    <AddProspectDialog
                                        trigger={
                                            <Button size="lg" variant="outline" className="gap-2">
                                                <UserPlus className="h-4 w-4" />
                                                Ajouter manuellement
                                            </Button>
                                        }
                                    />
                                </div>

                                {/* Keyboard shortcut hint */}
                                <p className="text-sm text-slate-400 dark:text-slate-500">
                                    💡 Astuce : Appuyez sur <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">M</kbd> pour un accès rapide
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Prospect list with filters */
                    <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
                        <CardContent className="p-6 space-y-6">
                            {/* Filters */}
                            <ProspectFilters
                                search={filters.search}
                                status={filters.status}
                                source={filters.source}
                                fromDate={filters.fromDate}
                                toDate={filters.toDate}
                                onSearchChange={setSearch}
                                onStatusChange={(status) => setFilters({ status })}
                                onSourceChange={(source) => setFilters({ source })}
                                onDateRangeChange={(fromDate, toDate) => setFilters({ fromDate, toDate })}
                                onReset={resetFilters}
                            />

                            {/* Error state */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-center">
                                    Erreur lors du chargement des prospects: {error.message}
                                </div>
                            )}

                            {/* Table */}
                            <ProspectTable
                                prospects={prospects}
                                total={total}
                                page={filters.page}
                                pageSize={filters.pageSize}
                                isLoading={isLoading}
                                selectedIds={selectedIds}
                                onPaginationChange={(page, pageSize) => {
                                    setPage(page);
                                    if (pageSize !== filters.pageSize) {
                                        setPageSize(pageSize);
                                    }
                                }}
                                onRowClick={handleRowClick}
                                onSelectionChange={setSelectedIds}
                                onDeleteClick={handleDeleteClick}
                                onReEnrichClick={handleReEnrichClick}
                            />

                            {/* Pagination */}
                            {total > 0 && (
                                <ProspectPagination
                                    page={filters.page}
                                    pageSize={filters.pageSize}
                                    total={total}
                                    onPageChange={setPage}
                                    onPageSizeChange={setPageSize}
                                />
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Quick actions when empty */}
                {isEmpty && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/prospects/import">
                            <Card className="border-0 shadow-lg shadow-slate-100 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl hover:shadow-xl transition-all duration-300 cursor-pointer group">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 group-hover:from-teal-200 group-hover:to-emerald-200 dark:group-hover:from-teal-800/50 dark:group-hover:to-emerald-800/50 rounded-2xl flex items-center justify-center transition-colors">
                                            <FileSpreadsheet className="h-7 w-7 text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                Importer un CSV
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Importez des centaines de prospects en un clic avec validation automatique
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Card className="border-0 shadow-lg shadow-slate-100 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl hover:shadow-xl transition-all duration-300 cursor-pointer group">
                            <CardContent className="p-6">
                                <AddProspectDialog
                                    trigger={
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="w-14 h-14 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 group-hover:from-violet-200 group-hover:to-purple-200 dark:group-hover:from-violet-800/50 dark:group-hover:to-purple-800/50 rounded-2xl flex items-center justify-center transition-colors">
                                                <UserPlus className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                    Ajouter manuellement
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Ajoutez un contact rencontré lors d&apos;un événement ou recommandation
                                                </p>
                                            </div>
                                        </div>
                                    }
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Detail Sheet */}
            <ProspectDetailSheet
                prospect={selectedProspect}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />

            {/* Delete Dialog (Story 3.6) */}
            {prospectToDelete && (
                <DeleteProspectDialog
                    prospect={prospectToDelete}
                    workspaceId={workspaceId || ''}
                    open={deleteDialogOpen}
                    onOpenChange={(open) => {
                        setDeleteDialogOpen(open);
                        if (!open) {
                            setProspectToDelete(null);
                            handleDeleteSuccess();
                        }
                    }}
                />
            )}

            {/* Bulk Action Bar (Story 3.6) - contains its own BulkDeleteDialog */}
            <BulkActionBar
                selectedIds={selectedIds}
                workspaceId={workspaceId || ''}
                onClearSelection={handleClearSelection}
            />
        </div>
    );
}

/**
 * Prospects Page wrapper with Suspense for useSearchParams
 */
export default function ProspectsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
        }>
            <ProspectsContent />
        </Suspense>
    );
}
