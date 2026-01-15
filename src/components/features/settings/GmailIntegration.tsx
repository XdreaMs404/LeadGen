'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface GmailIntegrationProps {
    gmailConnected: boolean;
    gmailEmail?: string;
}

export function GmailIntegration({ gmailConnected, gmailEmail }: GmailIntegrationProps) {
    const router = useRouter();
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const handleConnect = () => {
        setIsConnecting(true);
        // Redirect to Gmail OAuth with return path
        window.location.href = '/api/auth/gmail?from=/settings/integrations';
    };

    const handleDisconnect = async () => {
        setIsDisconnecting(true);

        try {
            const response = await fetch('/api/auth/gmail/revoke', {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Gmail disconnected successfully');
                router.refresh();
            } else {
                toast.error(data.error?.message || 'Failed to disconnect Gmail');
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Gmail Integration
                </CardTitle>
                <CardDescription>
                    Connect your Gmail account to send prospecting emails.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <GmailIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Gmail</p>
                            {gmailConnected && gmailEmail ? (
                                <p className="text-sm text-muted-foreground">{gmailEmail}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground">Not connected</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {gmailConnected ? (
                            <>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    Connected
                                </Badge>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm" disabled={isDisconnecting}>
                                            {isDisconnecting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Disconnecting...
                                                </>
                                            ) : (
                                                'Disconnect'
                                            )}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Disconnect Gmail</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will revoke LeadGen&apos;s access to send emails from your Gmail account.
                                                You will need to reconnect Gmail to resume sending campaigns.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDisconnect}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Disconnect
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        ) : (
                            <>
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3 text-muted-foreground" />
                                    Not connected
                                </Badge>
                                <Button
                                    onClick={handleConnect}
                                    disabled={isConnecting}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    {isConnecting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        'Connect Gmail'
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function GmailIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
                fill="#EA4335"
            />
        </svg>
    );
}
