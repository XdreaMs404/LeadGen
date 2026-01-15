'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface GmailConnectStepProps {
    isConnected: boolean;
    connectedEmail?: string;
    onNext: () => void;
}

export function GmailConnectStep({ isConnected, connectedEmail, onNext }: GmailConnectStepProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isConnecting, setIsConnecting] = useState(false);

    // Handle OAuth callback results
    useEffect(() => {
        const gmailConnected = searchParams.get('gmail_connected');
        const error = searchParams.get('error');

        if (gmailConnected === 'true') {
            toast.success('Gmail connected successfully!');
            router.replace('/onboarding'); // Clear query params
        }

        if (error) {
            const errorMessages: Record<string, string> = {
                GMAIL_SCOPE_DENIED: 'Gmail access is required to send emails. Please try again and accept the permissions.',
                INVALID_CALLBACK: 'Invalid OAuth callback. Please try again.',
                INVALID_STATE: 'Security check failed. Please try again.',
                SESSION_EXPIRED: 'Your session has expired. Please log in again.',
                NO_WORKSPACE: 'No workspace found. Please contact support.',
                TOKEN_EXCHANGE_FAILED: 'Failed to connect Gmail. Please try again.',
                NO_REFRESH_TOKEN: 'Failed to get refresh token. Please try again.',
                USER_INFO_FAILED: 'Failed to get Gmail account info. Please try again.',
                SERVER_ERROR: 'An unexpected error occurred. Please try again.',
            };

            const message = errorMessages[error] || 'Failed to connect Gmail. Please try again.';
            toast.error(message);
            router.replace('/onboarding'); // Clear query params
        }
    }, [searchParams, router]);

    const handleConnect = () => {
        setIsConnecting(true);
        window.location.href = '/api/auth/gmail';
    };

    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Connect Your Gmail</CardTitle>
                <CardDescription>
                    LeadGen needs access to your Gmail to send prospecting emails on your behalf.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isConnected ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <div>
                                <p className="font-medium text-green-800 dark:text-green-200">Gmail Connected</p>
                                <p className="text-sm text-green-600 dark:text-green-400">{connectedEmail}</p>
                            </div>
                        </div>
                        <Button onClick={onNext} className="w-full" size="lg">
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 text-sm">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <span>Send personalized emails from your Gmail account</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <span>Track replies and responses automatically</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <span>Maintain full control - disconnect anytime</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                LeadGen will request permission to send and read emails.
                                Your data is encrypted and never shared.
                            </p>
                        </div>

                        <Button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
                            size="lg"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <GoogleIcon className="mr-2 h-5 w-5" />
                                    Connect with Google
                                </>
                            )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                            By connecting, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    );
}
