import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { GmailIntegration } from '@/components/features/settings/GmailIntegration';

export const metadata = {
    title: 'Integrations | Settings | LeadGen',
    description: 'Manage your integrations',
};

async function getIntegrationsData() {
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

export default async function IntegrationsPage() {
    const { gmailConnected, gmailEmail } = await getIntegrationsData();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Integrations</h1>
                <p className="text-muted-foreground">
                    Manage your connected services and integrations.
                </p>
            </div>
            <GmailIntegration
                gmailConnected={gmailConnected}
                gmailEmail={gmailEmail}
            />
        </div>
    );
}
