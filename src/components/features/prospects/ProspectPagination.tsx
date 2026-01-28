'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ProspectPaginationProps {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100];

/**
 * ProspectPagination component with premium design
 * Story 3.4: Prospect List & Status Display with Filters (AC1, AC6)
 */
export function ProspectPagination({
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
}: ProspectPaginationProps) {
    const totalPages = Math.ceil(total / pageSize);
    const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);

    const canGoPrevious = page > 1;
    const canGoNext = page < totalPages;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2">
            {/* Results summary with premium styling */}
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-100/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm border border-border/30 shadow-sm">
                {total === 0 ? (
                    <span className="text-sm text-muted-foreground">Aucun prospect</span>
                ) : (
                    <span className="text-sm">
                        <span className="font-semibold text-foreground">{startItem}</span>
                        <span className="text-muted-foreground"> – </span>
                        <span className="font-semibold text-foreground">{endItem}</span>
                        <span className="text-muted-foreground"> sur </span>
                        <span className="font-semibold text-violet-600 dark:text-violet-400">{total}</span>
                        <span className="text-muted-foreground"> prospect{total > 1 ? 's' : ''}</span>
                    </span>
                )}
            </div>

            <div className="flex items-center gap-6">
                {/* Page size selector with premium styling */}
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Afficher</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(value) => onPageSizeChange(Number(value))}
                    >
                        <SelectTrigger className="w-[75px] h-9 rounded-lg bg-white/60 dark:bg-slate-900/60 border-border/50 shadow-sm">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <SelectItem key={size} value={String(size)} className="rounded-lg">
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Page navigation with premium styling */}
                <div className="flex items-center gap-1.5">
                    {/* First page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "h-9 w-9 rounded-lg bg-white/60 dark:bg-slate-900/60 border-border/50 shadow-sm transition-all",
                            canGoPrevious && "hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:border-violet-200"
                        )}
                        onClick={() => onPageChange(1)}
                        disabled={!canGoPrevious}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                        <span className="sr-only">Première page</span>
                    </Button>

                    {/* Previous page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "h-9 w-9 rounded-lg bg-white/60 dark:bg-slate-900/60 border-border/50 shadow-sm transition-all",
                            canGoPrevious && "hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:border-violet-200"
                        )}
                        onClick={() => onPageChange(page - 1)}
                        disabled={!canGoPrevious}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Page précédente</span>
                    </Button>

                    {/* Page indicator */}
                    <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25 min-w-[100px] text-center">
                        <span className="text-sm font-semibold">
                            Page {page} / {totalPages || 1}
                        </span>
                    </div>

                    {/* Next page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "h-9 w-9 rounded-lg bg-white/60 dark:bg-slate-900/60 border-border/50 shadow-sm transition-all",
                            canGoNext && "hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:border-violet-200"
                        )}
                        onClick={() => onPageChange(page + 1)}
                        disabled={!canGoNext}
                    >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Page suivante</span>
                    </Button>

                    {/* Last page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "h-9 w-9 rounded-lg bg-white/60 dark:bg-slate-900/60 border-border/50 shadow-sm transition-all",
                            canGoNext && "hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:border-violet-200"
                        )}
                        onClick={() => onPageChange(totalPages)}
                        disabled={!canGoNext}
                    >
                        <ChevronsRight className="h-4 w-4" />
                        <span className="sr-only">Dernière page</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
