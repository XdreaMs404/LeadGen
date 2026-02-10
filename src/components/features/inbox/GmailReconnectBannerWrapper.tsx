'use client';

import { useWorkspace } from '@/hooks/use-workspace';
import { GmailReconnectBanner } from '@/components/features/inbox/GmailReconnectBanner';

/**
 * Wrapper for GmailReconnectBanner that connects to workspace state
 */
export function GmailReconnectBannerWrapper() {
    const { workspace, isLoading } = useWorkspace();

    if (isLoading || !workspace) return null;

    // Check if we have a Gmail token and if it's valid
    // Note: workspace.gmailToken comes from /api/workspace/me
    const hasToken = !!workspace.gmailToken;
    const isValid = workspace.gmailToken?.isValid ?? false;

    return (
        <GmailReconnectBanner
            isConnected={isValid}
            wasConnected={hasToken}
        />
    );
}
