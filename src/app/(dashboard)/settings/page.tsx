import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsTabs } from '@/components/features/settings/SettingsTabs';
import { Settings, Shield } from 'lucide-react';
import { prisma } from '@/lib/prisma/client';

export const metadata = {
    title: 'Paramètres — LeadGen',
    description: 'Gérez les paramètres de votre compte',
};

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const workspace = await prisma.workspace.findFirst({
        where: { userId: user.id },
        include: { gmailToken: true },
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-8 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

                <div className="relative z-10 flex items-start gap-4">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <Settings className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Paramètres</h1>
                        <p className="text-white/70">
                            Gérez votre compte et vos préférences de sécurité.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <SettingsTabs
                user={user}
                gmailConnected={!!workspace?.gmailToken}
                gmailEmail={workspace?.gmailToken?.email}
            />
        </div>
    );
}
