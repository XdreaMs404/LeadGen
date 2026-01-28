/**
 * Delete Prospect Hooks
 * Story 3.6: TanStack Query hooks for prospect deletion
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ActiveCampaign } from '@/lib/prospects/get-active-campaigns';

interface DeleteResponse {
    deleted: boolean;
    cascade: {
        enrichmentJobsCancelled: number;
        emailsCancelled: number;
        enrollmentsCancelled: number;
        threadsArchived: number;
    };
}

interface BulkDeleteResponse {
    deleted: number;
    skipped: number;
    cascade: {
        enrichmentJobsCancelled: number;
        emailsCancelled: number;
        enrollmentsCancelled: number;
        threadsArchived: number;
    };
}

interface CampaignsResponse {
    campaigns: ActiveCampaign[];
}

/**
 * Hook to delete a single prospect
 * Invalidates prospect list on success
 */
export function useDeleteProspect(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (prospectId: string): Promise<DeleteResponse> => {
            const res = await fetch(`/api/prospects/${prospectId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Erreur lors de la suppression');
            }

            const { data } = await res.json();
            return data;
        },
        onSuccess: () => {
            // Invalidate prospect queries
            queryClient.invalidateQueries({ queryKey: ['prospects', workspaceId] });
            toast.success('Prospect supprimé');
        },
        onError: (error: Error) => {
            console.error('[useDeleteProspect] Error:', error);
            toast.error(error.message || 'Erreur lors de la suppression');
        },
    });
}

/**
 * Hook to bulk delete multiple prospects
 * Invalidates prospect list on success
 */
export function useBulkDeleteProspects(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (prospectIds: string[]): Promise<BulkDeleteResponse> => {
            const res = await fetch('/api/prospects/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prospectIds }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Erreur lors de la suppression');
            }

            const { data } = await res.json();
            return data;
        },
        onSuccess: (data) => {
            // Invalidate prospect queries
            queryClient.invalidateQueries({ queryKey: ['prospects', workspaceId] });
            toast.success(`${data.deleted} prospect${data.deleted > 1 ? 's' : ''} supprimé${data.deleted > 1 ? 's' : ''}`);
        },
        onError: (error: Error) => {
            console.error('[useBulkDeleteProspects] Error:', error);
            toast.error(error.message || 'Erreur lors de la suppression');
        },
    });
}

/**
 * Hook to get active campaigns for a prospect
 * Used to show warning before deletion (AC2)
 */
export function useProspectActiveCampaigns(prospectId: string | null) {
    return useQuery<CampaignsResponse>({
        queryKey: ['prospects', prospectId, 'campaigns'],
        queryFn: async () => {
            const res = await fetch(`/api/prospects/${prospectId}/campaigns`);

            if (!res.ok) {
                throw new Error('Erreur lors du chargement des campagnes');
            }

            const { data } = await res.json();
            return data;
        },
        enabled: !!prospectId,
        staleTime: 30 * 1000, // 30 seconds
    });
}
