'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, Shield, Zap, Mail } from 'lucide-react'

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleGoogleSignIn() {
        setIsLoading(true)
        setError(null)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    scopes: 'openid email profile',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })

            if (error) {
                setError(error.message)
                setIsLoading(false)
            }
        } catch (err) {
            setError('Une erreur inattendue est survenue')
            setIsLoading(false)
            console.error('OAuth error:', err)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-600 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
                <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full" />

                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <span className="text-2xl font-bold">LeadGen</span>
                    </div>

                    {/* Value Proposition */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold mb-4">
                                Automatisez votre prospection B2B
                            </h1>
                            <p className="text-xl text-white/80">
                                Envoyez des emails personnalisés à grande échelle et convertissez plus de prospects en clients.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium">Séquences email intelligentes</p>
                                    <p className="text-sm text-white/70">Personnalisation avancée avec IA</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium">Délivrabilité optimisée</p>
                                    <p className="text-sm text-white/70">Configuration DNS automatique</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium">Suivi en temps réel</p>
                                    <p className="text-sm text-white/70">Ouvertures, clics, réponses</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-sm text-white/60">
                        © 2026 LeadGen. Tous droits réservés.
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">LeadGen</span>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900">Bienvenue !</h2>
                            <p className="text-muted-foreground">
                                Connectez-vous pour accéder à votre espace de prospection
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full h-12 text-base font-medium bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 hover:border-slate-300 shadow-sm transition-all"
                            size="lg"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Connexion en cours...
                                </span>
                            ) : (
                                <span className="flex items-center gap-3">
                                    <GoogleIcon className="w-5 h-5" />
                                    Continuer avec Google
                                </span>
                            )}
                        </Button>

                        <p className="text-center text-xs text-muted-foreground">
                            En continuant, vous acceptez nos{' '}
                            <a href="#" className="underline hover:text-foreground">Conditions d&apos;utilisation</a>
                            {' '}et notre{' '}
                            <a href="#" className="underline hover:text-foreground">Politique de confidentialité</a>
                        </p>
                    </div>

                    {/* Trust indicators */}
                    <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Shield className="h-4 w-4 text-emerald-500" />
                            <span>Données sécurisées</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span>Inscription gratuite</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
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
    )
}
