import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { calculateProgress, isOnboardingComplete } from '@/lib/onboarding/onboarding-service';

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
        const progressPercent = calculateProgress(workspace);
        const onboardingComplete = isOnboardingComplete(workspace);

        const response: OnboardingStatusResponse = {
            gmailConnected,
            gmailEmail,
            spfStatus: workspace.spfStatus,
            dkimStatus: workspace.dkimStatus,
            dmarcStatus: workspace.dmarcStatus,
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
