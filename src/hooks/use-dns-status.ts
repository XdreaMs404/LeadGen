import { useQuery } from '@tanstack/react-query';
import type { DnsStatusResponse } from '@/types/dns';
import type { ApiResponse } from '@/lib/utils/api-response';

async function fetchDnsStatus(): Promise<DnsStatusResponse> {
    const response = await fetch('/api/workspace/dns-status');
    const json: ApiResponse<DnsStatusResponse> = await response.json();

    if (!json.success) {
        throw new Error(json.error.message);
    }

    return json.data;
}

/**
 * Hook to fetch DNS status for the current workspace
 * Uses TanStack Query with auto-refetch on window focus
 */
export function useDnsStatus() {
    const query = useQuery({
        queryKey: ['dns-status'],
        queryFn: fetchDnsStatus,
        refetchOnWindowFocus: true,
        staleTime: 30_000, // 30 seconds
    });

    return {
        spfStatus: query.data?.spfStatus ?? 'NOT_STARTED',
        dkimStatus: query.data?.dkimStatus ?? 'NOT_STARTED',
        dmarcStatus: query.data?.dmarcStatus ?? 'NOT_STARTED',
        dkimSelector: query.data?.dkimSelector ?? null,
        domain: query.data?.domain ?? null,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}
