'use client';

import { useState, useMemo, useCallback } from 'react';
import { useProspects } from '@/hooks/use-prospects';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Users, UserCheck, Search, Building2, Mail } from 'lucide-react';
import { isRiskySource } from '@/types/prospect';
import { Input } from '@/components/ui/input';

interface ProspectSelectorProps {
    selectedProspectIds: string[];
    onSelectionChange: (prospectIds: string[]) => void;
}

/**
 * ProspectSelector Component - Story 5.2 (AC3)
 * Premium redesign with search, better visual hierarchy, and modern styling
 */
export function ProspectSelector({ selectedProspectIds, onSelectionChange }: ProspectSelectorProps) {
    const [page] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const { data, isLoading } = useProspects({ page, pageSize: 500 });

    const { allProspects, verifiedCount, unverifiedCount, needsReviewCount } = useMemo(() => {
        if (!data?.prospects) return { allProspects: [], verifiedCount: 0, unverifiedCount: 0, needsReviewCount: 0 };

        // Sort: verified first, then needs_review, then not_verified
        const sorted = [...data.prospects].sort((a, b) => {
            const order = { 'VERIFIED': 0, 'NEEDS_REVIEW': 1, 'NOT_VERIFIED': 2, 'NEW': 3 };
            return (order[a.status as keyof typeof order] ?? 4) - (order[b.status as keyof typeof order] ?? 4);
        });

        const verified = data.prospects.filter(p => p.status === 'VERIFIED').length;
        const unverified = data.prospects.filter(p => p.status === 'NOT_VERIFIED' || p.status === 'NEW').length;
        const needsReview = data.prospects.filter(p => p.status === 'NEEDS_REVIEW').length;

        return { allProspects: sorted, verifiedCount: verified, unverifiedCount: unverified, needsReviewCount: needsReview };
    }, [data?.prospects]);

    // Filter by search - now includes all prospects
    const filteredProspects = useMemo(() => {
        if (!searchQuery.trim()) return allProspects;
        const q = searchQuery.toLowerCase();
        return allProspects.filter(p =>
            p.email.toLowerCase().includes(q) ||
            p.firstName?.toLowerCase().includes(q) ||
            p.lastName?.toLowerCase().includes(q) ||
            p.company?.toLowerCase().includes(q)
        );
    }, [allProspects, searchQuery]);

    const hasRiskySource = useMemo(() => {
        return allProspects
            .filter(p => selectedProspectIds.includes(p.id))
            .some(p => p.sourceDetail && isRiskySource(p.sourceDetail));
    }, [allProspects, selectedProspectIds]);

    // Check if any selected prospect is unverified
    const hasUnverifiedSelected = useMemo(() => {
        return allProspects
            .filter(p => selectedProspectIds.includes(p.id))
            .some(p => p.status !== 'VERIFIED');
    }, [allProspects, selectedProspectIds]);

    const allSelected = allProspects.length > 0 && selectedProspectIds.length === allProspects.length;
    const someSelected = selectedProspectIds.length > 0 && !allSelected;

    const handleSelectAll = useCallback(() => {
        if (allSelected) {
            onSelectionChange([]);
        } else {
            // Select all prospects (verified and unverified)
            onSelectionChange(allProspects.map(p => p.id));
        }
    }, [allSelected, allProspects, onSelectionChange]);

    const handleToggle = useCallback((prospectId: string) => {
        if (selectedProspectIds.includes(prospectId)) {
            onSelectionChange(selectedProspectIds.filter(id => id !== prospectId));
        } else {
            onSelectionChange([...selectedProspectIds, prospectId]);
        }
    }, [selectedProspectIds, onSelectionChange]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div>
                        <Skeleton className="h-5 w-48 mb-1" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
                <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (allProspects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-6">
                    <Users className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Aucun prospect vérifié
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    Importez des prospects et lancez l&apos;enrichissement pour les vérifier.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
                    <Users className="h-6 w-6 text-violet-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Sélectionnez vos prospects
                    </h3>
                    <p className="text-sm text-slate-500">
                        Choisissez les prospects vérifiés à inclure dans cette campagne
                    </p>
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-3">
                <div
                    role="button"
                    tabIndex={0}
                    onClick={handleSelectAll}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectAll()}
                    className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium border cursor-pointer transition-all hover:bg-slate-50',
                        allSelected
                            ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-950 dark:border-violet-700 dark:text-violet-300'
                            : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                    )}
                >
                    <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => handleSelectAll()}
                        className={cn(
                            'transition-colors',
                            someSelected && 'data-[state=checked]:bg-violet-500'
                        )}
                    />
                    Tout sélectionner ({allProspects.length})
                </div>

                <div className="flex-1" />

                <Badge
                    variant="outline"
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full transition-all',
                        selectedProspectIds.length > 0
                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0'
                            : 'text-slate-500'
                    )}
                >
                    <UserCheck className="h-3.5 w-3.5" />
                    {selectedProspectIds.length} sélectionné{selectedProspectIds.length > 1 ? 's' : ''}
                </Badge>
            </div>

            {/* Risky source warning */}
            {hasRiskySource && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                            Attention aux sources à risque
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300/80">
                            Certains prospects proviennent de listes achetées ou de sources inconnues.
                        </p>
                    </div>
                </div>
            )}

            {/* Warning for unverified selection */}
            {hasUnverifiedSelected && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        Certains prospects sélectionnés ne sont pas vérifiés. La campagne peut échouer si les emails sont invalides.
                    </p>
                </div>
            )}

            {/* Stats badges */}
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full text-xs bg-green-50 text-green-700 border-green-200">
                    {verifiedCount} vérifié{verifiedCount !== 1 ? 's' : ''}
                </Badge>
                {unverifiedCount > 0 && (
                    <Badge variant="outline" className="rounded-full text-xs bg-amber-50 text-amber-700 border-amber-200">
                        {unverifiedCount} non vérifié{unverifiedCount > 1 ? 's' : ''}
                    </Badge>
                )}
                {needsReviewCount > 0 && (
                    <Badge variant="outline" className="rounded-full text-xs bg-slate-50 text-slate-600 border-slate-200">
                        {needsReviewCount} à revoir
                    </Badge>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Rechercher par email, nom ou entreprise..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl border-slate-200 focus:border-violet-300 focus:ring-violet-500/20"
                />
            </div>

            {/* Prospect list */}
            <div className="max-h-[320px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProspects.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        Aucun résultat pour "{searchQuery}"
                    </div>
                ) : (
                    filteredProspects.map((prospect) => {
                        const isSelected = selectedProspectIds.includes(prospect.id);

                        return (
                            <label
                                key={prospect.id}
                                className={cn(
                                    'flex items-center gap-4 p-4 cursor-pointer transition-all duration-200',
                                    'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                                    isSelected && 'bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30'
                                )}
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleToggle(prospect.id)}
                                    className={cn(
                                        'transition-all',
                                        isSelected && 'border-violet-500 bg-violet-500'
                                    )}
                                />

                                {/* Avatar */}
                                <div className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold transition-all',
                                    isSelected
                                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                )}>
                                    {(prospect.firstName?.[0] || prospect.email[0]).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={cn(
                                            'font-medium truncate text-sm',
                                            isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-900 dark:text-white'
                                        )}>
                                            {prospect.email}
                                        </span>
                                        {prospect.status === 'VERIFIED' ? (
                                            <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 rounded-full px-2">
                                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                                Vérifié
                                            </Badge>
                                        ) : prospect.status === 'NEEDS_REVIEW' ? (
                                            <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-300 bg-slate-100 dark:bg-slate-800 dark:border-slate-600 rounded-full px-2">
                                                À revoir
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 rounded-full px-2">
                                                <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                                                Non vérifié
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        {(prospect.firstName || prospect.lastName) && (
                                            <span className="flex items-center gap-1 truncate">
                                                {[prospect.firstName, prospect.lastName].filter(Boolean).join(' ')}
                                            </span>
                                        )}
                                        {prospect.company && (
                                            <span className="flex items-center gap-1 truncate">
                                                <Building2 className="h-3 w-3" />
                                                {prospect.company}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {isSelected && (
                                    <CheckCircle2 className="h-5 w-5 text-violet-500 flex-shrink-0" />
                                )}
                            </label>
                        );
                    })
                )}
            </div>
        </div>
    );
}
