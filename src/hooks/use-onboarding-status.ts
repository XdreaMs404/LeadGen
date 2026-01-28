'use client';

import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from './use-workspace';

interface OnboardingStatus {
    gmailConnected: boolean;
    gmailEmail: string | null;
    spfStatus: string;
    dkimStatus: string;
    dmarcStatus: string;
    onboardingComplete: boolean;
    progressPercent: number;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
}

async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
    const response = await fetch('/api/workspace/onboarding-status');
    const result: ApiResponse<OnboardingStatus> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error?.message ?? 'Erreur lors de la récupération du statut');
    }

    return result.data;
}

export function useOnboardingStatus() {
    const { workspaceId, isLoading: workspaceLoading } = useWorkspace();

    const query = useQuery({
        queryKey: ['onboarding-status', workspaceId],
        queryFn: fetchOnboardingStatus,
        enabled: !!workspaceId,
        refetchOnWindowFocus: true,
        staleTime: 30 * 1000, // 30 seconds
    });

    return {
        ...query,
        gmailConnected: query.data?.gmailConnected ?? false,
        gmailEmail: query.data?.gmailEmail ?? null,
        spfStatus: query.data?.spfStatus ?? 'NOT_STARTED',
        dkimStatus: query.data?.dkimStatus ?? 'NOT_STARTED',
        dmarcStatus: query.data?.dmarcStatus ?? 'NOT_STARTED',
        onboardingComplete: query.data?.onboardingComplete ?? false,
        progressPercent: query.data?.progressPercent ?? 0,
        isLoading: workspaceLoading || query.isLoading,
    };
}
