'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User2, Loader2, Mail, AlertTriangle, CheckCircle2, Plug } from 'lucide-react';
import { signOut } from '@/lib/auth/actions';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { GmailIntegration } from './GmailIntegration';

interface SettingsTabsProps {
    user: User;
    gmailConnected: boolean;
    gmailEmail?: string;
}

export function SettingsTabs({ user, gmailConnected, gmailEmail }: SettingsTabsProps) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [isRevoking, setIsRevoking] = useState(false);

    const handleRevokeAccess = async () => {
        setIsRevoking(true);

        try {
            const result = await signOut({ queryClient, scope: 'global' });

            if (result.success) {
                toast.success('Accès Google révoqué. Vous avez été déconnecté.');
                router.push('/login');
            } else {
                toast.error(result.error || 'Échec de la révocation');
                setIsRevoking(false);
            }
        } catch {
            toast.error('Une erreur inattendue est survenue');
            setIsRevoking(false);
        }
    };

    return (
        <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-slate-100 p-1 rounded-xl">
                <TabsTrigger
                    value="general"
                    className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                    <User2 className="h-4 w-4" />
                    Compte
                </TabsTrigger>
                <TabsTrigger
                    value="integrations"
                    className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                    <Plug className="h-4 w-4" />
                    Intégrations
                </TabsTrigger>
                <TabsTrigger
                    value="security"
                    className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                    <Shield className="h-4 w-4" />
                    Sécurité
                </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
                <Card className="border-0 shadow-lg shadow-slate-100">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/25">
                                {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-1">
                                    {user.user_metadata?.full_name || 'Utilisateur'}
                                </h3>
                                <p className="text-muted-foreground">{user.email}</p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                        <Mail className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Email</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Vérifié
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                        <User2 className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Nom complet</p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.user_metadata?.full_name || 'Non défini'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
                <GmailIntegration
                    gmailConnected={gmailConnected}
                    gmailEmail={gmailEmail}
                />
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
                <Card className="border-0 shadow-lg shadow-slate-100">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold mb-4">Comptes connectés</h3>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <GoogleIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-medium">Google</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Connecté
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-red-50 border-red-100">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-red-900">Zone de danger</h3>
                                <p className="text-sm text-red-700/70">
                                    Actions irréversibles et destructives.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
                            <div>
                                <p className="font-medium text-red-900">Révoquer l&apos;accès Google</p>
                                <p className="text-sm text-red-700/70">
                                    Vous serez déconnecté de tous les appareils.
                                </p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        disabled={isRevoking}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {isRevoking ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Révocation...
                                            </>
                                        ) : (
                                            'Révoquer'
                                        )}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                            <AlertTriangle className="h-6 w-6 text-red-600" />
                                        </div>
                                        <AlertDialogTitle className="text-center">
                                            Révoquer l&apos;accès Google ?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-center">
                                            Cette action révoquera votre connexion OAuth Google et vous déconnectera
                                            de tous les appareils. Vous devrez vous reconnecter avec Google pour utiliser LeadGen.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="sm:justify-center gap-2">
                                        <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleRevokeAccess}
                                            className="bg-red-600 hover:bg-red-700 rounded-xl"
                                        >
                                            Oui, révoquer l&apos;accès
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
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
