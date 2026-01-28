'use client';

import * as React from 'react';
import { AlertTriangle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

interface ReconnectGmailPromptProps {
    /** Callback to initiate Gmail OAuth flow */
    onReconnect?: () => void;
    /** Whether the reconnect action is in progress */
    isLoading?: boolean;
}

/**
 * Prompt shown when Gmail token is invalid/expired.
 * Encourages user to reconnect their Gmail account.
 */
export function ReconnectGmailPrompt({
    onReconnect,
    isLoading = false,
}: ReconnectGmailPromptProps) {
    const handleReconnect = () => {
        if (onReconnect) {
            onReconnect();
        } else {
            // Default behavior: redirect to Gmail OAuth endpoint
            window.location.href = '/api/auth/gmail';
        }
    };

    return (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                    <CardTitle className="text-lg text-amber-900 dark:text-amber-100">
                        Connexion Gmail expirée
                    </CardTitle>
                </div>
                <CardDescription className="text-amber-800/80 dark:text-amber-200/80">
                    Votre connexion Gmail a expiré. Reconnectez-vous pour continuer à envoyer des emails.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    onClick={handleReconnect}
                    disabled={isLoading}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                    <Mail className="mr-2 h-4 w-4" />
                    {isLoading ? 'Connexion...' : 'Reconnecter Gmail'}
                </Button>
            </CardContent>
        </Card>
    );
}
