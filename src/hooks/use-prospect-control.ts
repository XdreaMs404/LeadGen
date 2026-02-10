/**
 * Prospect Control Hooks
 * Story 5.7: Individual Lead Control within Campaign
 * 
 * React Query hooks for managing prospect enrollment status.
 */

'use client';

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWorkspace } from '@/hooks/use-workspace';
import type { ProspectStatusUpdateResponse, ProspectAction } from '@/types/prospect-control';
import type { ApiResponse } from '@/lib/utils/api-response';
import type { CampaignProspectResponse } from '@/types/campaign';

/**
 * Fetch prospects for a campaign with pagination
 */
async function fetchCampaignProspects(
    campaignId: string,
    page: number = 1,
    perPage: number = 25
): Promise<{
    prospects: CampaignProspectResponse[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
}> {
    const res = await fetch(
        `/api/campaigns/${campaignId}/prospects?page=${page}&perPage=${perPage}`
    );
    const data: ApiResponse<{
        prospects: CampaignProspectResponse[];
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    }> = await res.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Erreur lors du chargement des prospects');
    }

    return data.data;
}

/**
 * Update prospect status via API
 */
async function updateProspectStatus(
    campaignId: string,
    prospectId: string,
    action: ProspectAction
): Promise<ProspectStatusUpdateResponse> {
    const res = await fetch(
        `/api/campaigns/${campaignId}/prospects/${prospectId}/status`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
        }
    );
    const data: ApiResponse<ProspectStatusUpdateResponse> = await res.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Erreur lors de la mise à jour');
    }

    return data.data;
}

/**
 * Hook for fetching campaign prospects with pagination
 */
export function useCampaignProspects(
    campaignId: string | undefined,
    page: number = 1,
    perPage: number = 25
) {
    const { workspaceId } = useWorkspace();

    return useQuery({
        queryKey: ['campaigns', workspaceId, campaignId, 'prospects', { page, perPage }],
        queryFn: () =>
            campaignId ? fetchCampaignProspects(campaignId, page, perPage) : null,
        enabled: !!workspaceId && !!campaignId,
    });
}

/**
 * Hook for updating prospect enrollment status
 */
export function useProspectStatusMutation(campaignId: string) {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: ({
            prospectId,
            action,
        }: {
            prospectId: string;
            action: ProspectAction;
            prospectName: string;
        }) => updateProspectStatus(campaignId, prospectId, action),

        onSuccess: (data, variables) => {
            const { action, prospectName } = variables;

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({
                queryKey: ['campaigns', workspaceId, campaignId, 'prospects'],
            });
            queryClient.invalidateQueries({
                queryKey: ['campaigns', workspaceId, campaignId],
            });

            // Show success toast
            let message = '';
            switch (action) {
                case 'pause':
                    message = `Envois mis en pause pour ${prospectName}`;
                    break;
                case 'resume':
                    message = `Envois repris pour ${prospectName}`;
                    break;
                case 'stop':
                    message = `Envois arrêtés pour ${prospectName}. ${data.emailsCancelled ?? 0} email(s) annulé(s).`;
                    break;
            }

            toast.success(message);
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}
