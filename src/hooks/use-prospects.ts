'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWorkspace } from '@/hooks/use-workspace';
import type { Prospect, ProspectCreateInput, ProspectStatus, ProspectSource } from '@/types/prospect';
import type { ApiResponse } from '@/lib/utils/api-response';

// ===== Types for Prospect List Query (Story 3.4) =====

export interface ProspectsParams {
    page: number;
    pageSize: number;
    search?: string;
    status?: ProspectStatus[];
    source?: ProspectSource[];
    fromDate?: string;
    toDate?: string;
}

export interface ProspectsResponse {
    prospects: Prospect[];
    total: number;
    page: number;
    pageSize: number;
}

// ===== useProspects Query Hook (Story 3.4) =====

/**
 * Hook for fetching paginated and filtered prospects list
 * Uses keepPreviousData for smooth pagination transitions
 */
export function useProspects(params: ProspectsParams) {
    const { workspaceId } = useWorkspace();

    return useQuery({
        queryKey: ['prospects', workspaceId, params] as const,
        queryFn: async (): Promise<ProspectsResponse> => {
            const searchParams = new URLSearchParams();
            searchParams.set('page', String(params.page));
            searchParams.set('pageSize', String(params.pageSize));

            if (params.search) searchParams.set('search', params.search);
            params.status?.forEach(s => searchParams.append('status', s));
            params.source?.forEach(s => searchParams.append('source', s));
            if (params.fromDate) searchParams.set('fromDate', params.fromDate);
            if (params.toDate) searchParams.set('toDate', params.toDate);

            const res = await fetch(`/api/prospects?${searchParams}`);
            const json: ApiResponse<ProspectsResponse> = await res.json();

            if (!json.success) {
                throw new Error(json.error.message);
            }

            return json.data;
        },
        placeholderData: keepPreviousData,
        enabled: !!workspaceId,
    });
}

// ===== useCreateProspect Mutation Hook (Story 3.3) =====

/**
 * Hook for creating a new prospect
 * Story 3.3: Manual Prospect Creation
 */
export function useCreateProspect() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: async (data: ProspectCreateInput): Promise<Prospect> => {
            const res = await fetch('/api/prospects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const json: ApiResponse<Prospect> = await res.json();

            if (!json.success) {
                // Special handling for duplicate prospects
                if (json.error.code === 'DUPLICATE_PROSPECT') {
                    const details = json.error.details as { prospectId?: string } | undefined;
                    throw new DuplicateProspectError(json.error.message, details?.prospectId);
                }
                throw new Error(json.error.message);
            }

            return json.data;
        },
        onSuccess: () => {
            toast.success('Prospect ajouté');
            // Invalidate prospects list to trigger refetch
            if (workspaceId) {
                queryClient.invalidateQueries({ queryKey: ['prospects', workspaceId] });
            }
        },
        onError: (error: Error) => {
            if (error instanceof DuplicateProspectError) {
                // Let the caller handle duplicate errors for linking
                return;
            }
            toast.error('Erreur lors de la création');
        },
    });
}

/**
 * Custom error for duplicate prospect detection
 * Contains the existing prospect ID for potential linking
 */
export class DuplicateProspectError extends Error {
    constructor(
        message: string,
        public prospectId?: string
    ) {
        super(message);
        this.name = 'DuplicateProspectError';
    }
}
