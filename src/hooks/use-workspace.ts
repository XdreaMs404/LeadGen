'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useWorkspace() {
    const supabase = createClient();

    const query = useQuery({
        queryKey: ['active-workspace'],
        queryFn: async () => {
            // For MVP, since we have 1:1 User:Workspace, we fetch the workspace for the current user
            // In Phase 2, this would read from a cookie/url or allow selection
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // We'll fetch this via a dedicated endpoint in the future, 
            // but for now we can infer it or fetch it.
            // Actually, for the hook to be useful immediately without a new endpoint,
            // we might rely on the side-effect of other calls or a simple check.

            // Wait, if we don't have an endpoint to "get my workspace ID", 'use-dns-status' 
            // was trying to solve this by hitting '/api/workspace/dns-status'.
            // Circular dependency if use-dns-status needs workspaceId to fetch dns-status.

            // Solution: For MVP, the API routes (like dns-status) infer workspace from session.
            // But the *Query Key* needs the ID to be correct. 
            // We should fetch the basic workspace info first.

            const response = await fetch('/api/workspace/me');
            if (!response.ok) return null;
            return response.json();
        },
        staleTime: Infinity, // Workspace ID doesn't change often
    });

    return {
        workspaceId: query.data?.data?.id,
        workspace: query.data?.data,
        isLoading: query.isLoading,
        error: query.error
    };
}
