'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from './use-workspace';
import { toast } from 'sonner';
import type { IcpConfig, IcpConfigInput } from '@/types/icp';
import type { ApiResponse } from '@/lib/utils/api-response';

/**
 * Hook to read ICP configuration for the current workspace
 */
export function useIcp() {
    const { workspaceId, isLoading: workspaceLoading } = useWorkspace();

    const query = useQuery<ApiResponse<IcpConfig | null>>({
        queryKey: ['icp', workspaceId],
        queryFn: async () => {
            const response = await fetch('/api/workspace/icp');
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération de l\'ICP');
            }
            return response.json();
        },
        enabled: !!workspaceId && !workspaceLoading,
    });

    return {
        icpConfig: query.data?.success ? query.data.data : null,
        isLoading: query.isLoading || workspaceLoading,
        error: query.error,
    };
}

/**
 * Hook to update ICP configuration
 */
export function useUpdateIcp() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async (data: IcpConfigInput): Promise<ApiResponse<IcpConfig>> => {
            const response = await fetch('/api/workspace/icp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success('ICP sauvegardé');
                queryClient.invalidateQueries({ queryKey: ['icp', workspaceId] });
            } else {
                toast.error(data.error?.message || 'Erreur lors de la sauvegarde');
            }
        },
        onError: () => {
            toast.error('Erreur lors de la sauvegarde de l\'ICP');
        },
    });
}
