/**
 * CampaignProspectsList Component
 * Story 5.7: Individual Lead Control within Campaign
 * 
 * Displays paginated list of prospects enrolled in a campaign with actions.
 */

'use client';

import { useState } from 'react';
import { useCampaignProspects } from '@/hooks/use-prospect-control';
import { EnrollmentStatusBadge } from './EnrollmentStatusBadge';
import { ProspectControlDropdown } from './ProspectControlDropdown';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CampaignStatus } from '@prisma/client';

interface CampaignProspectsListProps {
    campaignId: string;
    campaignStatus?: CampaignStatus;
}

const PAGE_SIZES = [25, 50, 100] as const;

export function CampaignProspectsList({ campaignId, campaignStatus }: CampaignProspectsListProps) {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState<number>(25);

    const { data, isLoading, error } = useCampaignProspects(campaignId, page, perPage);

    if (isLoading) {
        return <ProspectsListSkeleton />;
    }

    if (error) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Erreur lors du chargement des prospects
            </div>
        );
    }

    if (!data || data.prospects.length === 0) {
        return (
            <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                    Aucun prospect inscrit à cette campagne
                </p>
            </div>
        );
    }

    const { prospects, total, totalPages } = data;

    const getProspectDisplayName = (prospect: NonNullable<typeof prospects[0]['prospect']>) => {
        const name = [prospect.firstName, prospect.lastName].filter(Boolean).join(' ');
        return name || prospect.email;
    };

    // Determine if controls should be disabled based on campaign status
    const isControlsDisabled = campaignStatus === 'STOPPED' || campaignStatus === 'COMPLETED';

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold">Prospect</TableHead>
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Statut</TableHead>
                            <TableHead className="text-center font-semibold">Étape</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {prospects.map((enrollment) => {
                            const prospect = enrollment.prospect;
                            const displayName = prospect
                                ? getProspectDisplayName(prospect)
                                : 'Prospect inconnu';

                            return (
                                <TableRow key={enrollment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <TableCell className="font-medium">
                                        {displayName}
                                        {prospect?.company && (
                                            <span className="text-muted-foreground text-sm ml-2">
                                                • {prospect.company}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {prospect?.email || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <EnrollmentStatusBadge
                                            status={enrollment.enrollmentStatus}
                                            enrolledAt={enrollment.enrolledAt}
                                            pausedAt={enrollment.pausedAt}
                                            completedAt={enrollment.completedAt}
                                            campaignStatus={campaignStatus}
                                            isDuplicate={(enrollment as { isDuplicate?: boolean }).isDuplicate}
                                        />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-medium">
                                            {enrollment.currentStep}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {!isControlsDisabled && (
                                            <ProspectControlDropdown
                                                campaignId={campaignId}
                                                prospectId={enrollment.prospectId}
                                                prospectName={displayName}
                                                enrollmentStatus={enrollment.enrollmentStatus}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        {total} prospect{total !== 1 ? 's' : ''} au total
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Par page:</span>
                            <Select
                                value={String(perPage)}
                                onValueChange={(value) => {
                                    setPerPage(Number(value));
                                    setPage(1); // Reset to first page when changing page size
                                }}
                            >
                                <SelectTrigger className="w-[70px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map((size) => (
                                        <SelectItem key={size} value={String(size)}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm px-2">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}

function ProspectsListSkeleton() {
    return (
        <div className="space-y-4">
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Prospect</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-center">Étape</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
