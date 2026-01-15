import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { extractDomainFromEmail } from '@/lib/constants/dns-providers';
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
        const workspace = await prisma.workspace.findFirst({
            where: { userId: user.id },
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

        const response: DnsStatusResponse = {
            spfStatus: workspace.spfStatus,
            dkimStatus: workspace.dkimStatus,
            dmarcStatus: workspace.dmarcStatus,
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
