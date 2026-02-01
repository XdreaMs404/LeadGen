import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { OnboardingWizard } from '@/components/features/onboarding/OnboardingWizard';
import { Sparkles } from 'lucide-react';

export const metadata = {
    title: 'Configuration — LeadGen',
    description: 'Configurez votre compte pour commencer à envoyer des campagnes',
};

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const workspace = await prisma.workspace.findFirst({
        where: { userId: user.id },
        include: { gmailToken: true },
    });

    if (!workspace) {
        return <div>Erreur : Espace de travail introuvable</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8">
            {/* Header */}
            <div className="text-center space-y-4 mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-2xl ring-1 ring-teal-500/20 mb-4">
                    <Sparkles className="h-8 w-8 text-teal-600" />
                </div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                    Configuration de votre compte
                </h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                    Suivez ces étapes pour connecter votre boîte mail et assurer une délivrabilité optimale pour vos campagnes.
                </p>
            </div>

            {/* Wizard */}
            <OnboardingWizard
                gmailConnected={!!workspace.gmailToken}
                gmailEmail={workspace.gmailToken?.email}
            />
        </div>
    );
}
