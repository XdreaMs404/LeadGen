import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { OnboardingWizard } from '@/components/features/onboarding/OnboardingWizard';

export const metadata = {
    title: 'Onboarding | LeadGen',
    description: 'Set up your LeadGen account',
};

async function getOnboardingData() {
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
        redirect('/');
    }

    return {
        gmailConnected: !!workspace.gmailToken,
        gmailEmail: workspace.gmailToken?.email,
    };
}

export default async function OnboardingPage() {
    const { gmailConnected, gmailEmail } = await getOnboardingData();

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto py-12 px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome to LeadGen</h1>
                    <p className="text-muted-foreground">
                        Let&apos;s get your account set up so you can start sending campaigns.
                    </p>
                </div>
                <Suspense fallback={<OnboardingLoading />}>
                    <OnboardingWizard
                        gmailConnected={gmailConnected}
                        gmailEmail={gmailEmail}
                    />
                </Suspense>
            </div>
        </div>
    );
}

function OnboardingLoading() {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
    );
}
