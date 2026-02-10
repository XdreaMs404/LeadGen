'use client';

/**
 * Gmail Reconnect Banner (Story 6.1)
 * 
 * Displays when Gmail OAuth tokens are invalid and user needs to re-authenticate
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GmailReconnectBannerProps {
    /** Whether the Gmail connection is currently valid */
    isConnected: boolean;
    /** Whether this was previously connected (to distinguish first-time vs reconnect) */
    wasConnected?: boolean;
}

const DISMISS_KEY = 'gmail-reconnect-banner-dismissed';

export function GmailReconnectBanner({
    isConnected,
    wasConnected = true
}: GmailReconnectBannerProps) {
    const router = useRouter();
    const [isDismissed, setIsDismissed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Check localStorage for dismissal (session-based)
    useEffect(() => {
        const dismissed = sessionStorage.getItem(DISMISS_KEY);
        if (dismissed === 'true') {
            setIsDismissed(true);
        }
    }, []);

    // Don't show if connected, dismissed, or never was connected
    if (isConnected || isDismissed || !wasConnected) {
        return null;
    }

    const handleReconnect = () => {
        setIsLoading(true);
        // Redirect to Gmail OAuth flow
        router.push('/api/auth/gmail');
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem(DISMISS_KEY, 'true');
    };

    return (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">
                            Connexion Gmail expirée
                        </p>
                        <p className="text-sm text-amber-700">
                            Reconnectez votre compte Gmail pour continuer à synchroniser les réponses.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReconnect}
                        disabled={isLoading}
                        className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                        {isLoading ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Reconnecter Gmail
                    </Button>

                    <button
                        onClick={handleDismiss}
                        className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded"
                        aria-label="Fermer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
