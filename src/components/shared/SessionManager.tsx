'use client';

import { useSessionExpiry } from '@/hooks/use-session-expiry';

/**
 * Client component that manages session-related side effects
 * Wraps session expiry detection and other auth-related behaviors
 */
export function SessionManager({ children }: { children: React.ReactNode }) {
    // Set up session expiry detection
    useSessionExpiry();

    return <>{children}</>;
}
