'use client';

import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from './use-workspace';
import type { CanLaunchResponse } from '@/types/guardrails';
import type { ApiResponse } from '@/lib/utils/api-response';

/**
 * Hook to check if the current workspace can send emails/launch campaigns.
 * 
 * Uses TanStack Query with the workspace ID in the key for proper caching.
 * Returns the pre-send check result with blocked reason if applicable.
 * 
 * @returns { canSend, blockedReason, isLoading, error, refetch }
 */
export function useCanSend() {
    const { workspaceId, isLoading: workspaceLoading } = useWorkspace();

    const query = useQuery({
        queryKey: ['can-send', workspaceId],
        queryFn: async (): Promise<CanLaunchResponse> => {
            const response = await fetch('/api/campaigns/check-launch');

            if (!response.ok) {
                throw new Error('Failed to check send status');
            }

            const result = await response.json() as ApiResponse<CanLaunchResponse>;

            if (!result.success) {
                throw new Error(result.error.message);
            }

            return result.data;
        },
        enabled: !!workspaceId, // Only fetch when workspace is available
        staleTime: 30 * 1000, // 30 seconds - check frequently since status can change
        refetchOnWindowFocus: true, // Refetch when user returns to tab
    });

    return {
        canSend: query.data?.canLaunch ?? false,
        blockedReason: query.data?.blockedReason,
        isLoading: workspaceLoading || query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}
