'use client';

/**
 * Inbox Filters Component (Story 6.3 AC4)
 * 
 * Provides filtering and search for inbox conversations:
 * - Filter by classification (multi-select)
 * - Filter by unread
 * - Search with debounce
 * - Quick filters
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ConversationFilters } from '@/hooks/use-conversations';
import type { ReplyClassification } from '@prisma/client';

interface InboxFiltersProps {
    filters: ConversationFilters;
    onFilterChange: (filters: Partial<ConversationFilters>) => void;
}

// Use actual ReplyClassification enum values from Prisma schema
const classificationOptions: { value: ReplyClassification; label: string }[] = [
    { value: 'INTERESTED', label: 'Intéressé' },
    { value: 'NOT_INTERESTED', label: 'Pas intéressé' },
    { value: 'OUT_OF_OFFICE', label: 'Absent' },
    { value: 'UNSUBSCRIBE', label: 'Désinscrit' },
    { value: 'BOUNCE', label: 'Bounce' },
    { value: 'OTHER', label: 'Autre' },
];

interface QuickFilter {
    id: string;
    label: string;
    apply: () => Partial<ConversationFilters>;
}

export function InboxFilters({ filters, onFilterChange }: InboxFiltersProps) {
    const [searchValue, setSearchValue] = useState('');
    const [selectedClassifications, setSelectedClassifications] = useState<ReplyClassification[]>([]);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search using useEffect
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            onFilterChange({ search: searchValue || undefined } as Partial<ConversationFilters>);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchValue]); // Intentionally excluding onFilterChange to avoid re-triggering

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    }, []);

    const handleClassificationToggle = useCallback((classification: ReplyClassification) => {
        setSelectedClassifications(prev => {
            const newSelection = prev.includes(classification)
                ? prev.filter(c => c !== classification)
                : [...prev, classification];
            return newSelection;
        });
    }, []);

    // Sync classification changes to parent filter state
    useEffect(() => {
        onFilterChange({
            classification: selectedClassifications.length > 0 ? selectedClassifications : undefined
        } as Partial<ConversationFilters>);
    }, [selectedClassifications]); // Intentionally excluding onFilterChange to prevent loops

    const handleUnreadToggle = useCallback(() => {
        onFilterChange({ hasUnread: !filters.hasUnread });
    }, [filters.hasUnread, onFilterChange]);

    const handleClearFilters = useCallback(() => {
        setSearchValue('');
        setSelectedClassifications([]);
        onFilterChange({
            hasUnread: undefined,
            classification: undefined,
            search: undefined,
        } as Partial<ConversationFilters>);
    }, [onFilterChange]);

    // Quick filters
    const quickFilters: QuickFilter[] = useMemo(() => [
        {
            id: 'unread',
            label: 'Non lus',
            apply: () => ({ hasUnread: true }),
        },
        {
            id: 'interested',
            label: 'Intéressés',
            apply: () => ({ classification: ['INTERESTED'] as ReplyClassification[] } as Partial<ConversationFilters>),
        },
        {
            id: 'needs-action',
            label: 'À traiter',
            apply: () => ({ classification: ['OTHER', 'INTERESTED'] as ReplyClassification[] } as Partial<ConversationFilters>),
        },
    ], []);

    const hasActiveFilters = filters.hasUnread || selectedClassifications.length > 0 || searchValue;

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    type="search"
                    placeholder="Rechercher un prospect..."
                    value={searchValue}
                    onChange={handleSearchChange}
                    className="pl-9"
                />
            </div>

            {/* Classification Filter */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            selectedClassifications.length > 0 && "border-teal-300 bg-teal-50"
                        )}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Classification
                        {selectedClassifications.length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs">
                                {selectedClassifications.length}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Filtrer par classification</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {classificationOptions.map((option) => (
                        <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={selectedClassifications.includes(option.value)}
                            onCheckedChange={() => handleClassificationToggle(option.value)}
                        >
                            {option.label}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Unread Toggle */}
            <Button
                variant={filters.hasUnread ? "default" : "outline"}
                size="sm"
                onClick={handleUnreadToggle}
                className={cn(
                    filters.hasUnread && "bg-teal-600 hover:bg-teal-700"
                )}
            >
                Non lus
            </Button>

            {/* Quick filters */}
            <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-3">
                {quickFilters.map((filter) => (
                    <Button
                        key={filter.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const applied = filter.apply();
                            if ('classification' in applied && applied.classification) {
                                setSelectedClassifications(applied.classification as ReplyClassification[]);
                            }
                            onFilterChange(applied);
                        }}
                        className="text-slate-600 hover:text-slate-900"
                    >
                        {filter.label}
                    </Button>
                ))}
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-slate-500 hover:text-slate-700"
                >
                    <X className="h-4 w-4 mr-1" />
                    Effacer
                </Button>
            )}
        </div>
    );
}
