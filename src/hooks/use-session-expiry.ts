'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { signOut } from '@/lib/auth/actions';
import { toast } from 'sonner';
import type { AuthChangeEvent } from '@supabase/supabase-js';

/**
 * Hook to detect session expiry and handle automatic logout
 * Listens to Supabase auth state changes and handles SIGNED_OUT events
 * Displays toast notification when session expires
 * 
 * @returns void - Side-effect only hook
 */
export function useSessionExpiry(): void {
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleSessionExpiry = useCallback(async () => {
        // Clear cache via signOut (session already expired)
        await signOut({ queryClient, scope: 'local' });

        toast.info('Session expired, please log in again');
        router.push('/login');
    }, [queryClient, router]);

    useEffect(() => {
        const supabase = createClient();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event: AuthChangeEvent, session) => {
                // Handle session expiry or token expiration
                if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
                    // Check if this was an intentional logout
                    const isIntentionalLogout = sessionStorage.getItem('leadgen:is_logging_out');

                    if (isIntentionalLogout) {
                        // Clear the flag and do nothing (UserNav handles the success toast)
                        sessionStorage.removeItem('leadgen:is_logging_out');
                        return;
                    }

                    // Only trigger if we were previously logged in (not initial mount)
                    // This prevents false triggers on page load when already logged out
                    handleSessionExpiry();
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [handleSessionExpiry]);
}
