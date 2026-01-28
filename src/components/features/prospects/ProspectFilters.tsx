'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, CalendarDays, Sparkles, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { SOURCE_OPTIONS } from '@/types/prospect';
import type { ProspectStatus, ProspectSource } from '@/types/prospect';

interface ProspectFiltersProps {
    search: string;
    status: ProspectStatus[];
    source: ProspectSource[];
    fromDate?: string;
    toDate?: string;
    onSearchChange: (search: string) => void;
    onStatusChange: (status: ProspectStatus[]) => void;
    onSourceChange: (source: ProspectSource[]) => void;
    onDateRangeChange: (fromDate?: string, toDate?: string) => void;
    onReset: () => void;
}

/**
 * Status options for multi-select filter with colors
 */
const STATUS_OPTIONS: { value: ProspectStatus; label: string; color: string }[] = [
    { value: 'NEW', label: 'Nouveau', color: 'bg-slate-500' },
    { value: 'ENRICHING', label: 'Enrichissement', color: 'bg-blue-500' },
    { value: 'VERIFIED', label: 'Vérifié', color: 'bg-emerald-500' },
    { value: 'NOT_VERIFIED', label: 'Non vérifié', color: 'bg-red-500' },
    { value: 'NEEDS_REVIEW', label: 'À vérifier', color: 'bg-amber-500' },
    { value: 'SUPPRESSED', label: 'Supprimé', color: 'bg-gray-400' },
    { value: 'CONTACTED', label: 'Contacté', color: 'bg-purple-500' },
    { value: 'REPLIED', label: 'A répondu', color: 'bg-green-500' },
    { value: 'BOUNCED', label: 'Rebond', color: 'bg-orange-500' },
    { value: 'UNSUBSCRIBED', label: 'Désabonné', color: 'bg-gray-500' },
    { value: 'BOOKED', label: 'RDV', color: 'bg-indigo-500' },
];

/**
 * Quick filter presets
 */
type QuickFilter = 'verified' | 'needs_review' | 'not_enriched';

const QUICK_FILTERS: { key: QuickFilter; label: string; statuses: ProspectStatus[]; icon: React.ReactNode }[] = [
    { key: 'verified', label: 'Vérifiés', statuses: ['VERIFIED'], icon: <span className="w-2 h-2 rounded-full bg-emerald-500" /> },
    { key: 'needs_review', label: 'À réviser', statuses: ['NEEDS_REVIEW'], icon: <span className="w-2 h-2 rounded-full bg-amber-500" /> },
    { key: 'not_enriched', label: 'Nouveaux', statuses: ['NEW'], icon: <span className="w-2 h-2 rounded-full bg-slate-500" /> },
];

/**
 * ProspectFilters component with premium design
 * Story 3.4: Prospect List & Status Display with Filters (AC3, AC4)
 */
export function ProspectFilters({
    search,
    status,
    source,
    fromDate,
    toDate,
    onSearchChange,
    onStatusChange,
    onSourceChange,
    onDateRangeChange,
    onReset,
}: ProspectFiltersProps) {
    // Debounced search state
    const [searchInput, setSearchInput] = useState(search);

    // Sync search input when external value changes
    useEffect(() => {
        setSearchInput(search);
    }, [search]);

    // Debounce search input (300ms as per AC4)
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchInput !== search) {
                onSearchChange(searchInput);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchInput, search, onSearchChange]);

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (status.length > 0) count++;
        if (source.length > 0) count++;
        if (fromDate || toDate) count++;
        return count;
    }, [status, source, fromDate, toDate]);

    // Toggle status filter
    const toggleStatus = (value: ProspectStatus) => {
        const newStatus = status.includes(value)
            ? status.filter(s => s !== value)
            : [...status, value];
        onStatusChange(newStatus);
    };

    // Toggle source filter
    const toggleSource = (value: ProspectSource) => {
        const newSource = source.includes(value)
            ? source.filter(s => s !== value)
            : [...source, value];
        onSourceChange(newSource);
    };

    // Apply quick filter
    const applyQuickFilter = (filter: QuickFilter) => {
        const preset = QUICK_FILTERS.find(f => f.key === filter);
        if (preset) {
            // Toggle: if already active, clear; otherwise apply
            const isActive = isQuickFilterActive(filter);
            onStatusChange(isActive ? [] : preset.statuses);
        }
    };

    // Check if a quick filter is active
    const isQuickFilterActive = (filter: QuickFilter): boolean => {
        const preset = QUICK_FILTERS.find(f => f.key === filter);
        if (!preset) return false;
        return (
            status.length === preset.statuses.length &&
            preset.statuses.every(s => status.includes(s))
        );
    };

    return (
        <div className="space-y-4">
            {/* Search and Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Premium Search Input */}
                <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-violet-500 transition-colors" />
                    <Input
                        type="search"
                        placeholder="Rechercher par nom, email, entreprise..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-11 pr-10 py-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-border/50 rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all"
                    />
                    {searchInput && (
                        <button
                            onClick={() => setSearchInput('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filter Popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "gap-2 shrink-0 px-4 py-5 rounded-xl border-border/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:border-violet-200 dark:hover:border-violet-800 transition-all",
                                activeFilterCount > 0 && "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/50"
                            )}
                        >
                            <Filter className={cn("h-4 w-4", activeFilterCount > 0 && "text-violet-600")} />
                            <span className={cn(activeFilterCount > 0 && "text-violet-600")}>Filtres</span>
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-violet-600 text-white">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 rounded-xl shadow-xl border-border/50" align="end">
                        <div className="p-4 space-y-5">
                            {/* Status Filter */}
                            <div>
                                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-violet-500" />
                                    Statut
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {STATUS_OPTIONS.map((option) => (
                                        <label
                                            key={option.value}
                                            className={cn(
                                                "flex items-center gap-2.5 text-sm cursor-pointer p-2 rounded-lg transition-colors",
                                                status.includes(option.value)
                                                    ? "bg-violet-50 dark:bg-violet-950/50"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-900"
                                            )}
                                        >
                                            <Checkbox
                                                checked={status.includes(option.value)}
                                                onCheckedChange={() => toggleStatus(option.value)}
                                                className="border-2"
                                            />
                                            <span className={cn("w-2 h-2 rounded-full", option.color)} />
                                            <span className="truncate">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Source Filter */}
                            <div>
                                <h4 className="font-semibold text-sm mb-3">Source</h4>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {SOURCE_OPTIONS.map((option) => (
                                        <label
                                            key={option.value}
                                            className={cn(
                                                "flex items-center gap-2.5 text-sm cursor-pointer p-2 rounded-lg transition-colors",
                                                source.includes(option.value as ProspectSource)
                                                    ? "bg-violet-50 dark:bg-violet-950/50"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-900"
                                            )}
                                        >
                                            <Checkbox
                                                checked={source.includes(option.value as ProspectSource)}
                                                onCheckedChange={() => toggleSource(option.value as ProspectSource)}
                                                className="border-2"
                                            />
                                            {option.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Date Range */}
                            <div>
                                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-violet-500" />
                                    Période de création
                                </h4>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    'flex-1 justify-start text-left font-normal rounded-lg',
                                                    !fromDate && 'text-muted-foreground'
                                                )}
                                            >
                                                <CalendarDays className="mr-2 h-4 w-4" />
                                                {fromDate
                                                    ? format(new Date(fromDate), 'dd/MM/yy', { locale: fr })
                                                    : 'Du'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={fromDate ? new Date(fromDate) : undefined}
                                                onSelect={(date) =>
                                                    onDateRangeChange(date?.toISOString(), toDate)
                                                }
                                                locale={fr}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    'flex-1 justify-start text-left font-normal rounded-lg',
                                                    !toDate && 'text-muted-foreground'
                                                )}
                                            >
                                                <CalendarDays className="mr-2 h-4 w-4" />
                                                {toDate
                                                    ? format(new Date(toDate), 'dd/MM/yy', { locale: fr })
                                                    : 'Au'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={toDate ? new Date(toDate) : undefined}
                                                onSelect={(date) =>
                                                    onDateRangeChange(fromDate, date?.toISOString())
                                                }
                                                locale={fr}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Reset Button */}
                            {activeFilterCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full gap-2 text-muted-foreground hover:text-foreground"
                                    onClick={onReset}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Réinitialiser les filtres
                                </Button>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Quick Filters with premium styling */}
            <div className="flex flex-wrap gap-2">
                {QUICK_FILTERS.map((filter) => (
                    <Button
                        key={filter.key}
                        variant={isQuickFilterActive(filter.key) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => applyQuickFilter(filter.key)}
                        className={cn(
                            "gap-2 rounded-full text-xs font-medium transition-all",
                            isQuickFilterActive(filter.key)
                                ? "bg-gradient-to-r from-violet-600 to-purple-600 border-0 shadow-md shadow-violet-500/25"
                                : "bg-white/60 dark:bg-slate-900/60 border-border/50 hover:bg-violet-50 dark:hover:bg-violet-950/50"
                        )}
                    >
                        {filter.icon}
                        {filter.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
