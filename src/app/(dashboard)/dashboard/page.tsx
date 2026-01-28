import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
    ArrowRight,
    Mail,
    Users,
    TrendingUp,
    Zap,
    Sparkles,
    CheckCircle2,
    Clock
} from 'lucide-react'
import { DashboardOnboardingSection } from '@/components/features/dashboard/DashboardOnboardingSection'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'là'

    return (
        <div className="space-y-8">
            {/* Onboarding Status Section */}
            <DashboardOnboardingSection />

            {/* Welcome Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 p-8 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Dashboard</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">
                        Bonjour {firstName} ! 👋
                    </h1>
                    <p className="text-white/90 max-w-xl">
                        Bienvenue sur LeadGen. Votre assistant de prospection B2B intelligent.
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg shadow-slate-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Emails envoyés</p>
                                <p className="text-3xl font-bold">0</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Mail className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Cette semaine</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-slate-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Prospects</p>
                                <p className="text-3xl font-bold">0</p>
                            </div>
                            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                                <Users className="h-6 w-6 text-violet-600" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            <span>Total</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-slate-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Taux d&apos;ouverture</p>
                                <p className="text-3xl font-bold">--</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="h-3 w-3" />
                            <span>Moyenne</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-slate-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Réponses</p>
                                <p className="text-3xl font-bold">0</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Cette semaine</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Getting Started */}
            <Card className="border-0 shadow-lg shadow-slate-100">
                <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Zap className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">Commencez votre première campagne</h2>
                            <p className="text-muted-foreground mb-6 max-w-xl">
                                Importez vos prospects, créez une séquence d&apos;emails personnalisés
                                et lancez votre première campagne de prospection en quelques minutes.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Button asChild className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-500/25">
                                    <Link href="/prospects">
                                        Importer des prospects
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/sequences">
                                        Créer une séquence
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-lg shadow-slate-100 hover:shadow-xl transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold group-hover:text-blue-600 transition-colors">Gérer les prospects</h3>
                                <p className="text-sm text-muted-foreground">Importez et organisez</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-slate-100 hover:shadow-xl transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-violet-50 group-hover:bg-violet-100 rounded-xl flex items-center justify-center transition-colors">
                                <Mail className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold group-hover:text-violet-600 transition-colors">Créer une séquence</h3>
                                <p className="text-sm text-muted-foreground">Automatisez vos emails</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-slate-100 hover:shadow-xl transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center transition-colors">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold group-hover:text-emerald-600 transition-colors">Voir les analytics</h3>
                                <p className="text-sm text-muted-foreground">Suivez vos performances</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
