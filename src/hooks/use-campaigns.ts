'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWorkspace } from '@/hooks/use-workspace';
import type { CampaignResponse, CreateCampaignInput, UpdateCampaignInput } from '@/types/campaign';
import type { ApiResponse } from '@/lib/utils/api-response';

// ===== Response Types =====

interface CampaignsResponse {
    campaigns: CampaignResponse[];
}

// ===== useCampaigns Query Hook (Story 5.1 - AC2) =====

/**
 * Hook for fetching all campaigns for the current workspace
 */
export function useCampaigns() {
    const { workspaceId } = useWorkspace();

    return useQuery({
        queryKey: ['campaigns', workspaceId] as const,
        queryFn: async (): Promise<CampaignsResponse> => {
            const res = await fetch('/api/campaigns');
            const json: ApiResponse<CampaignsResponse> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        placeholderData: keepPreviousData,
        enabled: !!workspaceId,
    });
}

// ===== useCampaign Query Hook (Story 5.1 - AC1, AC3) =====

/**
 * Hook for fetching a single campaign with enrollment counts
 */
export function useCampaign(campaignId: string | null) {
    const { workspaceId } = useWorkspace();

    return useQuery({
        queryKey: ['campaigns', workspaceId, campaignId] as const,
        queryFn: async (): Promise<CampaignResponse> => {
            const res = await fetch(`/api/campaigns/${campaignId}`);
            const json: ApiResponse<CampaignResponse> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        enabled: !!workspaceId && !!campaignId,
    });
}

// ===== useCreateCampaign Mutation Hook (Story 5.1 - AC1, AC2) =====

/**
 * Hook for creating a new campaign
 */
export function useCreateCampaign() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async (data: CreateCampaignInput): Promise<CampaignResponse> => {
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const json: ApiResponse<CampaignResponse> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: (campaign) => {
            toast.success('Campagne créée');
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
            }
            return campaign;
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la création');
        },
    });
}

// ===== useUpdateCampaign Mutation Hook (Story 5.1 - AC1) =====

/**
 * Hook for updating a campaign (name)
 */
export function useUpdateCampaign() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async ({ campaignId, data }: { campaignId: string; data: UpdateCampaignInput }): Promise<CampaignResponse> => {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const json: ApiResponse<CampaignResponse> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: (campaign) => {
            toast.success('Campagne mise à jour');
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
                queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId, campaign.id] });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la mise à jour');
        },
    });
}

// ===== useDeleteCampaign Mutation Hook (Story 5.1 - AC1) =====

/**
 * Hook for deleting a campaign (only if DRAFT status)
 */
export function useDeleteCampaign() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async (campaignId: string): Promise<void> => {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'DELETE',
            });

            const json: ApiResponse<{ deleted: boolean }> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }
        },
        onSuccess: () => {
            toast.success('Campagne supprimée');
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la suppression');
        },
    });
}

// ===== useLaunchCampaign Mutation Hook (Story 5.2 - AC5) =====

interface LaunchCampaignInput {
    campaignId: string;
    prospectIds: string[];
}

/**
 * Hook for launching a campaign
 * Story 5.2: Campaign Launch Wizard - AC5
 * 
 * Sends selected prospects to the launch API which:
 * - Runs pre-launch checks
 * - Updates campaign status: DRAFT → RUNNING
 * - Creates CampaignProspect enrollment records
 */
export function useLaunchCampaign() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async ({ campaignId, prospectIds }: LaunchCampaignInput): Promise<CampaignResponse> => {
            const res = await fetch(`/api/campaigns/${campaignId}/launch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prospectIds }),
            });

            const json: ApiResponse<CampaignResponse> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: (campaign) => {
            toast.success('Campagne lancée!', {
                description: `${campaign.enrollmentCounts?.total || 0} prospects inscrits`,
            });
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
                queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId, campaign.id] });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors du lancement');
        },
    });
}

