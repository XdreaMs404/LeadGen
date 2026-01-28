import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { validateAllDns } from '@/lib/dns/dns-validation';
import { extractDomainFromEmail } from '@/lib/constants/dns-providers';
import type { DnsValidationResult } from '@/types/dns';

// DnsStatus type matching Prisma enum
type DnsStatus = 'NOT_STARTED' | 'PASS' | 'FAIL' | 'UNKNOWN' | 'MANUAL_OVERRIDE';

// Map validation result status to Prisma DnsStatus
function mapToDnsStatus(result: DnsValidationResult): DnsStatus {
    switch (result.status) {
        case 'PASS':
            return 'PASS';
        case 'FAIL':
            return 'FAIL';
        case 'UNKNOWN':
        default:
            return 'UNKNOWN';
    }
}

// Check if all DNS records are PASS
function allRecordsPass(results: {
    spf: DnsValidationResult;
    dkim: DnsValidationResult;
    dmarc: DnsValidationResult;
}): boolean {
    return (
        results.spf.status === 'PASS' &&
        results.dkim.status === 'PASS' &&
        results.dmarc.status === 'PASS'
    );
}

/**
 * POST /api/workspace/dns/validate-all
 * Validates all DNS records (SPF, DKIM, DMARC) in parallel
 */
export async function POST() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            error('UNAUTHORIZED', 'Non authentifié'),
            { status: 401 }
        );
    }

    try {
        // Get workspace with Gmail token for domain
        const workspace = await prisma.workspace.findFirst({
            where: { userId: user.id },
            select: {
                id: true,
                dkimSelector: true,
                gmailToken: {
                    select: { email: true },
                },
            },
        });

        if (!workspace) {
            return NextResponse.json(
                error('NOT_FOUND', 'Aucun workspace trouvé'),
                { status: 404 }
            );
        }

        // Extract domain from Gmail email
        const domain = workspace.gmailToken?.email
            ? extractDomainFromEmail(workspace.gmailToken.email)
            : null;

        if (!domain) {
            return NextResponse.json(
                error('NO_DOMAIN', 'Connectez d\'abord votre compte Gmail pour obtenir le domaine'),
                { status: 400 }
            );
        }

        const effectiveSelector = workspace.dkimSelector || 'google';
        console.log(`[DNS Validate-All] Validating all for domain: ${domain}, selector: ${effectiveSelector}`);

        // Validate all records in parallel
        const results = await validateAllDns(domain, effectiveSelector);

        // Update all DNS statuses atomically
        await prisma.workspace.update({
            where: { id: workspace.id },
            data: {
                spfStatus: mapToDnsStatus(results.spf),
                dkimStatus: mapToDnsStatus(results.dkim),
                dmarcStatus: mapToDnsStatus(results.dmarc),
            },
        });

        // Trigger onboarding status check
        const { checkAndUpdateOnboardingComplete } = await import('@/lib/onboarding/onboarding-service');
        await checkAndUpdateOnboardingComplete(workspace.id);

        // Check if all passed for celebration
        const allPass = allRecordsPass(results);

        console.log(`[DNS Validate-All] Results - SPF: ${results.spf.status}, DKIM: ${results.dkim.status}, DMARC: ${results.dmarc.status}`);

        return NextResponse.json(success({
            ...results,
            allPass,
        }));
    } catch (e) {
        console.error('Error validating all DNS records:', e);
        return NextResponse.json(
            error('INTERNAL_ERROR', 'Erreur lors de la validation DNS'),
            { status: 500 }
        );
    }
}
