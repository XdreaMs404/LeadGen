'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    type ColumnDef,
    type PaginationState,
    type RowSelectionState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronRight, Mail, Building2, Calendar, MoreHorizontal, Trash2, RefreshCw } from 'lucide-react';
import { ProspectStatusBadge } from './ProspectStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Prospect } from '@/types/prospect';
import { SOURCE_OPTIONS } from '@/types/prospect';

interface ProspectTableProps {
    prospects: Prospect[];
    total: number;
    page: number;
    pageSize: number;
    isLoading?: boolean;
    selectedIds?: string[];
    onPaginationChange?: (page: number, pageSize: number) => void;
    onRowClick?: (prospect: Prospect) => void;
    onSelectionChange?: (selectedIds: string[]) => void;
    onDeleteClick?: (prospect: Prospect) => void;
    onReEnrichClick?: (prospect: Prospect) => void;
}

/**
 * Get French label for source
 */
function getSourceLabel(source: string): string {
    const option = SOURCE_OPTIONS.find(o => o.value === source);
    return option?.label ?? source;
}

/**
 * Get initials from name
 */
function getInitials(firstName: string | null, lastName: string | null): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
}

interface ColumnOptions {
    onDeleteClick?: (prospect: Prospect) => void;
    onReEnrichClick?: (prospect: Prospect) => void;
}

/**
 * Create columns for prospect table with dynamic options
 * Story 3.6: Added selection checkbox and row actions
 */
function createColumns(options: ColumnOptions): ColumnDef<Prospect>[] {
    return [
        // Selection checkbox column
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Sélectionner tout"
                    className="translate-y-[2px]"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Sélectionner"
                    className="translate-y-[2px]"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: 'Prospect',
            cell: ({ row }) => {
                const firstName = row.original.firstName || '';
                const lastName = row.original.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                const initials = getInitials(firstName, lastName);

                return (
                    <div className="flex items-center gap-3">
                        {/* Avatar with gradient */}
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-violet-500/20">
                                {initials}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">
                                {fullName || 'Sans nom'}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{row.original.email}</span>
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'company',
            header: 'Entreprise',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{row.original.company || '—'}</p>
                        {row.original.title && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{row.original.title}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Statut',
            cell: ({ row }) => <ProspectStatusBadge status={row.original.status} />,
        },
        {
            accessorKey: 'source',
            header: 'Source',
            cell: ({ row }) => (
                <span className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {getSourceLabel(row.original.source)}
                </span>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Créé le',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(row.original.createdAt), 'dd MMM yyyy', { locale: fr })}
                </div>
            ),
        },
        // Actions column with dropdown menu
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const prospect = row.original;
                const canReEnrich = prospect.status === 'NEEDS_REVIEW' || prospect.status === 'NOT_VERIFIED';

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canReEnrich && options.onReEnrichClick && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        options.onReEnrichClick?.(prospect);
                                    }}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Relancer l'enrichissement
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    options.onDeleteClick?.(prospect);
                                }}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
}

/**
 * Premium skeleton row for loading state
 */
function SkeletonRow() {
    return (
        <TableRow className="hover:bg-transparent">
            {/* Checkbox */}
            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
            {/* Prospect */}
            <TableCell>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-36" />
                    </div>
                </div>
            </TableCell>
            {/* Company */}
            <TableCell>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            </TableCell>
            {/* Status */}
            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
            {/* Source */}
            <TableCell><Skeleton className="h-6 w-28 rounded-lg" /></TableCell>
            {/* Date */}
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            {/* Actions */}
            <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
        </TableRow>
    );
}

export function ProspectTable({
    prospects,
    total,
    page,
    pageSize,
    isLoading,
    selectedIds = [], // Default to empty array
    onPaginationChange,
    onRowClick,
    onSelectionChange,
    onDeleteClick,
    onReEnrichClick,
}: ProspectTableProps) {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: page - 1,
        pageSize,
    });
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    // Sync local selection state with prop (handle external updates like clearing)
    // We use a ref to track if the update came from the prop to avoid echoing it back
    const isSyncingFromProp = useRef(false);

    useEffect(() => {
        const newSelection = selectedIds.reduce((acc, id) => {
            acc[id] = true;
            return acc;
        }, {} as RowSelectionState);

        // Check if we need to update local state
        const currentKeys = Object.keys(rowSelection);
        const hasDifferences = currentKeys.length !== selectedIds.length ||
            !selectedIds.every(id => rowSelection[id]);

        if (hasDifferences) {
            isSyncingFromProp.current = true;
            setRowSelection(newSelection);
        }
    }, [selectedIds]); // dependent only on prop change

    // Notify parent of selection changes
    useEffect(() => {
        if (isSyncingFromProp.current) {
            isSyncingFromProp.current = false;
            return;
        }

        // Filter out IDs that are not in the current prospects list (fixes ghost selection on delete)
        // Also cleanup rowSelection for items that don't exist anymore
        const validProspectIds = new Set(prospects.map(p => p.id));
        const rawSelectedIds = Object.keys(rowSelection).filter((key) => rowSelection[key]);

        const validSelectedIds = rawSelectedIds.filter(id => validProspectIds.has(id));

        // Detect if we have ghost selections in local state and clean them up silently if needed
        // (optional, but keeps internal state clean)

        // Notify parent only if effective selection differs from what parent has
        const isDifferentFromProp = validSelectedIds.length !== selectedIds.length ||
            !validSelectedIds.every(id => selectedIds.includes(id));

        if (isDifferentFromProp) {
            onSelectionChange?.(validSelectedIds);
        }
    }, [rowSelection, prospects, onSelectionChange, selectedIds]);

    // Create columns with callbacks
    const columns = useCallback(() => createColumns({
        onDeleteClick,
        onReEnrichClick,
    }), [onDeleteClick, onReEnrichClick]);

    // Clear selection when page changes
    useEffect(() => {
        setRowSelection({});
    }, [page]);

    const table = useReactTable({
        data: prospects,
        columns: columns(),
        pageCount: Math.ceil(total / pageSize),
        state: {
            pagination,
            rowSelection,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: (updater) => {
            const newState = typeof updater === 'function'
                ? updater(pagination)
                : updater;
            setPagination(newState);
            onPaginationChange?.(newState.pageIndex + 1, newState.pageSize);
        },
        manualPagination: true,
        manualFiltering: true,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row.id,
    });

    return (
        <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 hover:bg-transparent border-b border-border/50">
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="font-semibold text-slate-600 dark:text-slate-300 py-4">
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        // Premium skeleton loading state
                        Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                            <SkeletonRow key={i} />
                        ))
                    ) : table.getRowModel().rows.length === 0 ? (
                        // Empty state
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Mail className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">Aucun prospect trouvé</p>
                                    <p className="text-sm text-muted-foreground/70">Essayez de modifier vos filtres</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        // Data rows with premium styling
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className={cn(
                                    'group cursor-pointer transition-all duration-200',
                                    'hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/30',
                                    'dark:hover:from-violet-950/20 dark:hover:to-purple-950/10',
                                    'border-b border-border/30 last:border-b-0'
                                )}
                                onClick={() => onRowClick?.(row.original)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="py-4">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
