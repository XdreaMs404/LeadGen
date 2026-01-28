'use client';

import { useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { ProspectStatus, ProspectSource } from '@/types/prospect';

/**
 * Filter state for prospect list
 * Story 3.4: Prospect List & Status Display with Filters
 */
export interface ProspectFiltersState {
    page: number;
    pageSize: number;
    search: string;
    status: ProspectStatus[];
    source: ProspectSource[];
    fromDate?: string;
    toDate?: string;
}

const DEFAULT_PAGE_SIZE = 25;

/**
 * Hook to sync prospect filter state with URL query params
 * Enables shareable/bookmarkable state as per AC6
 */
export function useProspectFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Parse current filters from URL
    const filters = useMemo((): ProspectFiltersState => ({
        page: Math.max(1, parseInt(searchParams.get('page') || '1')),
        pageSize: parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE)),
        search: searchParams.get('search') || '',
        status: searchParams.getAll('status') as ProspectStatus[],
        source: searchParams.getAll('source') as ProspectSource[],
        fromDate: searchParams.get('fromDate') || undefined,
        toDate: searchParams.get('toDate') || undefined,
    }), [searchParams]);

    // Update URL with new filter values
    const setFilters = useCallback((updates: Partial<ProspectFiltersState>) => {
        const newParams = new URLSearchParams(searchParams.toString());

        // Reset to page 1 when filters change (except page/pageSize updates)
        const isFilterChange = 'search' in updates || 'status' in updates ||
            'source' in updates || 'fromDate' in updates || 'toDate' in updates;

        if (isFilterChange && !('page' in updates)) {
            newParams.set('page', '1');
        }

        // Apply updates
        if ('page' in updates && updates.page !== undefined) {
            newParams.set('page', String(updates.page));
        }
        if ('pageSize' in updates && updates.pageSize !== undefined) {
            newParams.set('pageSize', String(updates.pageSize));
            newParams.set('page', '1'); // Reset to page 1 on pageSize change
        }
        if ('search' in updates) {
            if (updates.search) {
                newParams.set('search', updates.search);
            } else {
                newParams.delete('search');
            }
        }
        if ('status' in updates) {
            newParams.delete('status');
            updates.status?.forEach(s => newParams.append('status', s));
        }
        if ('source' in updates) {
            newParams.delete('source');
            updates.source?.forEach(s => newParams.append('source', s));
        }
        if ('fromDate' in updates) {
            if (updates.fromDate) {
                newParams.set('fromDate', updates.fromDate);
            } else {
                newParams.delete('fromDate');
            }
        }
        if ('toDate' in updates) {
            if (updates.toDate) {
                newParams.set('toDate', updates.toDate);
            } else {
                newParams.delete('toDate');
            }
        }

        router.push(`${pathname}?${newParams.toString()}`);
    }, [searchParams, router, pathname]);

    // Reset all filters to defaults
    const resetFilters = useCallback(() => {
        router.push(pathname);
    }, [router, pathname]);

    // Set page
    const setPage = useCallback((page: number) => {
        setFilters({ page });
    }, [setFilters]);

    // Set page size (resets to page 1)
    const setPageSize = useCallback((pageSize: number) => {
        setFilters({ pageSize });
    }, [setFilters]);

    // Set search term
    const setSearch = useCallback((search: string) => {
        setFilters({ search });
    }, [setFilters]);

    return {
        filters,
        setFilters,
        resetFilters,
        setPage,
        setPageSize,
        setSearch,
    };
}
