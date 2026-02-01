import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { calculateProgress, isOnboardingComplete } from '@/lib/onboarding/onboarding-service';
import { GMAIL_DOMAINS, extractDomainFromEmail } from '@/lib/constants/dns-providers';

export interface OnboardingStatusResponse {
    gmailConnected: boolean;
    gmailEmail: string | null;
    spfStatus: string;
    dkimStatus: string;
    dmarcStatus: string;
    onboardingComplete: boolean;
    progressPercent: number;
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(error('unauthorized', 'Non autorisé'), { status: 401 });
        }

        // Get user's workspace (first workspace for MVP - single workspace per user)
        const workspace = await prisma.workspace.findFirst({
            where: { userId: user.id },
            include: { gmailToken: true },
        });

        if (!workspace) {
            return NextResponse.json(error('not_found', 'Aucun workspace trouvé'), { status: 404 });
        }

        const gmailConnected = workspace.gmailToken !== null;
        const gmailEmail = workspace.gmailToken?.email ?? null;

        // Personal Gmail accounts have DNS managed by Google automatically
        const domain = gmailEmail ? extractDomainFromEmail(gmailEmail) : null;
        const isPersonalGmail = domain && GMAIL_DOMAINS.includes(domain);

        const progressPercent = calculateProgress(workspace);
        const onboardingComplete = isOnboardingComplete(workspace);

        const response: OnboardingStatusResponse = {
            gmailConnected,
            gmailEmail,
            spfStatus: isPersonalGmail ? 'PASS' : workspace.spfStatus,
            dkimStatus: isPersonalGmail ? 'PASS' : workspace.dkimStatus,
            dmarcStatus: isPersonalGmail ? 'PASS' : workspace.dmarcStatus,
            onboardingComplete,
            progressPercent,
        };

        return NextResponse.json(success(response));
    } catch (err) {
        console.error('[GET /api/workspace/onboarding-status]', err);
        return NextResponse.json(
            error('internal_error', 'Erreur lors de la récupération du statut'),
            { status: 500 }
        );
    }
}
