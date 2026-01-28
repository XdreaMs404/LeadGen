/**
 * useEnrichment Hooks
 * Story 3.5 - Task 8: React hooks for enrichment operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ReEnrichResponse {
    success: boolean;
    data?: {
        message: string;
        jobId: string;
        prospectId: string;
    };
    error?: {
        code: string;
        message: string;
    };
}

/**
 * Hook to trigger re-enrichment of a prospect
 * @param workspaceId - Current workspace ID for cache invalidation
 */
export function useReEnrich(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (prospectId: string): Promise<ReEnrichResponse> => {
            const response = await fetch(`/api/prospects/${prospectId}/enrich`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data: ReEnrichResponse = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error?.message || 'Erreur lors de la relance de l\'enrichissement');
            }

            return data;
        },
        onSuccess: (data, prospectId) => {
            // Invalidate prospect queries to refetch with new status
            queryClient.invalidateQueries({ queryKey: ['prospects', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['prospects', workspaceId, prospectId] });

            toast.success('Enrichissement relancé', {
                description: 'Le prospect sera enrichi dans les prochaines minutes.',
            });
        },
        onError: (error: Error) => {
            toast.error('Erreur de relance', {
                description: error.message,
            });
        },
    });
}
