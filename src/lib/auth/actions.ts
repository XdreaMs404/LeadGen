/**
 * Centralized auth actions for LeadGen
 * Provides signOut functionality with cache clearing and redirect
 */

import { createClient } from '@/lib/supabase/client';
import type { QueryClient } from '@tanstack/react-query';

export interface SignOutOptions {
    /** TanStack Query client instance for cache clearing */
    queryClient?: QueryClient;
    /** Redirect path after logout (default: '/login') */
    redirectTo?: string;
    /** Revoke all sessions globally (for OAuth revocation) */
    scope?: 'local' | 'global';
}

export interface SignOutResult {
    success: boolean;
    error?: string;
}

/**
 * Signs out the current user from Supabase
 * Clears TanStack Query cache if provided
 * 
 * @param options - SignOut configuration options
 * @returns Promise<SignOutResult>
 */
export async function signOut(options: SignOutOptions = {}): Promise<SignOutResult> {
    const { queryClient, scope = 'local' } = options;

    try {
        const supabase = createClient();

        // Set a flag to prevent useSessionExpiry from triggering "Session expired" toast
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('leadgen:is_logging_out', 'true');
        }

        // Sign out from Supabase with specified scope
        const { error } = await supabase.auth.signOut({ scope });

        if (error) {
            console.error('[Auth] Supabase signOut error:', error.message);
            return { success: false, error: error.message };
        }

        // Clear TanStack Query cache if provided
        if (queryClient) {
            queryClient.clear();
        }

        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error during signOut';
        console.error('[Auth] signOut exception:', message);
        return { success: false, error: message };
    }
}
