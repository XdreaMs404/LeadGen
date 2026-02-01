/**
 * Sending Settings React Query Hooks
 * Story 5.3: Sending Settings Configuration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SendingSettingsResponse, SendingSettingsInput } from '@/types/sending-settings';
import type { ApiResponse } from '@/lib/utils/api-response';

/**
 * Fetch sending settings for the current workspace
 */
export function useSendingSettings() {
    return useQuery<SendingSettingsResponse>({
        queryKey: ['settings', 'sending'],
        queryFn: async () => {
            const response = await fetch('/api/settings/sending');
            const data: ApiResponse<SendingSettingsResponse> = await response.json();

            if (!data.success) {
                throw new Error(data.error.message);
            }

            return data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Update sending settings for the current workspace
 */
export function useUpdateSendingSettings() {
    const queryClient = useQueryClient();

    return useMutation<SendingSettingsResponse, Error, SendingSettingsInput>({
        mutationFn: async (input: SendingSettingsInput) => {
            const response = await fetch('/api/settings/sending', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });

            const data: ApiResponse<SendingSettingsResponse> = await response.json();

            if (!data.success) {
                throw new Error(data.error.message);
            }

            return data.data;
        },
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['settings', 'sending'] });
            toast.success("Paramètres d'envoi enregistrés");
        },
        onError: (error) => {
            toast.error(error.message || "Erreur lors de l'enregistrement");
        },
    });
}
