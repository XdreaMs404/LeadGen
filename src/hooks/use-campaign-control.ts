'use client';

/**
 * Campaign Control Hook
 * Story 5.6: Campaign Control (Pause/Resume/Stop Global)
 * 
 * React Query mutation hook for updating campaign status
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/hooks/use-workspace';
import { CampaignAction, StatusUpdateResponse } from '@/types/campaign-control';
import { toast } from 'sonner';

interface UseCampaignStatusMutationOptions {
    onSuccess?: (data: StatusUpdateResponse) => void;
    onError?: (error: Error) => void;
}

/**
 * Mutation hook for updating campaign status (pause/resume/stop)
 */
export function useCampaignStatusMutation(options?: UseCampaignStatusMutationOptions) {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async ({ campaignId, action }: { campaignId: string; action: CampaignAction }) => {
            const response = await fetch(`/api/campaigns/${campaignId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            const json = await response.json();

            if (!json.success) {
                throw new Error(json.error?.message || 'Erreur lors de la mise à jour');
            }

            return json.data as StatusUpdateResponse;
        },
        onSuccess: (data, { campaignId, action }) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId, campaignId] });

            // Show success toast
            const messages: Record<CampaignAction, string> = {
                pause: 'Campagne mise en pause',
                resume: 'Campagne reprise',
                stop: data.emailsCancelled
                    ? `Campagne arrêtée. ${data.emailsCancelled} email(s) annulé(s).`
                    : 'Campagne arrêtée',
            };
            toast.success(messages[action]);

            options?.onSuccess?.(data);
        },
        onError: (error: Error, { action }) => {
            // Show error toast
            const actionLabels: Record<CampaignAction, string> = {
                pause: 'mettre en pause',
                resume: 'reprendre',
                stop: 'arrêter',
            };
            toast.error(`Impossible de ${actionLabels[action]} la campagne`, {
                description: error.message,
            });

            options?.onError?.(error);
        },
    });
}
