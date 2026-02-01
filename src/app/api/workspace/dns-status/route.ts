import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { extractDomainFromEmail, GMAIL_DOMAINS } from '@/lib/constants/dns-providers';
import type { DnsStatusResponse } from '@/types/dns';

/**
 * GET /api/workspace/dns-status
 * Returns the DNS configuration status for the authenticated user's workspace
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            error('UNAUTHORIZED', 'Non authentifié'),
            { status: 401 }
        );
    }

    try {
        // Get workspace with DNS status and Gmail token
        // TODO: In Phase 2, extract workspaceId from 'x-workspace-id' header or similar context
        const workspace = await prisma.workspace.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'asc' }, // Deterministic fallback for now
            select: {
                id: true,
                spfStatus: true,
                dkimStatus: true,
                dmarcStatus: true,
                dkimSelector: true,
                gmailToken: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        if (!workspace) {
            return NextResponse.json(
                error('NOT_FOUND', 'Aucun workspace trouvé'),
                { status: 404 }
            );
        }

        // Extract domain from Gmail email if available
        const domain = workspace.gmailToken?.email
            ? extractDomainFromEmail(workspace.gmailToken.email)
            : null;

        // Personal Gmail accounts (@gmail.com, @googlemail.com) have SPF/DKIM managed by Google
        // Automatically mark them as PASS since no manual configuration is needed
        const isPersonalGmail = domain && GMAIL_DOMAINS.includes(domain);

        const response: DnsStatusResponse = {
            spfStatus: isPersonalGmail ? 'PASS' : workspace.spfStatus,
            dkimStatus: isPersonalGmail ? 'PASS' : workspace.dkimStatus,
            dmarcStatus: isPersonalGmail ? 'PASS' : workspace.dmarcStatus,
            dkimSelector: workspace.dkimSelector,
            domain,
        };

        return NextResponse.json(success(response));
    } catch (e) {
        console.error('Error fetching DNS status:', e);
        return NextResponse.json(
            error('INTERNAL_ERROR', 'Erreur lors de la récupération du statut DNS'),
            { status: 500 }
        );
    }
}
