import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { validateSpf, validateDkim, validateDmarc } from '@/lib/dns/dns-validation';
import { extractDomainFromEmail } from '@/lib/constants/dns-providers';
import { z } from 'zod';
import type { DnsValidationResult } from '@/types/dns';

// DnsStatus type matching Prisma enum
type DnsStatus = 'NOT_STARTED' | 'PASS' | 'FAIL' | 'UNKNOWN' | 'MANUAL_OVERRIDE';

// Request body schema
const validateRequestSchema = z.object({
    recordType: z.enum(['spf', 'dkim', 'dmarc']),
    selector: z.string().min(1).max(50).optional(),
});

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

/**
 * POST /api/workspace/dns/validate
 * Validates a single DNS record (SPF, DKIM, or DMARC)
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            error('UNAUTHORIZED', 'Non authentifié'),
            { status: 401 }
        );
    }

    try {
        // Parse and validate request body
        const body = await request.json();
        const parsed = validateRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Paramètres invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        const { recordType, selector } = parsed.data;

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

        console.log(`[DNS Validate] ${recordType.toUpperCase()} for domain: ${domain}`);

        // Perform validation based on record type
        let result: DnsValidationResult;
        const effectiveSelector = selector || workspace.dkimSelector || 'google';

        switch (recordType) {
            case 'spf':
                result = await validateSpf(domain);
                break;
            case 'dkim':
                result = await validateDkim(domain, effectiveSelector);
                break;
            case 'dmarc':
                result = await validateDmarc(domain);
                break;
        }

        // Update workspace DNS status in database
        const statusField = `${recordType}Status` as 'spfStatus' | 'dkimStatus' | 'dmarcStatus';
        const updateData: Record<string, DnsStatus | string> = {
            [statusField]: mapToDnsStatus(result),
        };

        // Store DKIM selector if provided
        if (recordType === 'dkim' && selector) {
            updateData.dkimSelector = selector;
        }

        await prisma.workspace.update({
            where: { id: workspace.id },
            data: updateData,
        });

        // Check if this validation completes onboarding
        const { checkAndUpdateOnboardingComplete } = await import('@/lib/onboarding/onboarding-service');
        await checkAndUpdateOnboardingComplete(workspace.id);

        console.log(`[DNS Validate] ${recordType.toUpperCase()} result: ${result.status}`);

        return NextResponse.json(success(result));
    } catch (e) {
        console.error('Error validating DNS record:', e);
        return NextResponse.json(
            error('INTERNAL_ERROR', 'Erreur lors de la validation DNS'),
            { status: 500 }
        );
    }
}
