import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { DNS_ERROR_MESSAGES } from '@/lib/dns/dns-constants';
import { z } from 'zod';

// Request body schema
const overrideRequestSchema = z.object({
    recordType: z.enum(['spf', 'dkim', 'dmarc']),
    confirmed: z.boolean(),
});

/**
 * POST /api/workspace/dns/override
 * Manual override for a DNS record status
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
        const parsed = overrideRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Paramètres invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        const { recordType, confirmed } = parsed.data;

        // Require explicit confirmation
        if (!confirmed) {
            return NextResponse.json(
                error('CONFIRMATION_REQUIRED', DNS_ERROR_MESSAGES.MANUAL_OVERRIDE_WARNING),
                { status: 400 }
            );
        }

        // Get workspace
        const workspace = await prisma.workspace.findFirst({
            where: { userId: user.id },
            select: { id: true },
        });

        if (!workspace) {
            return NextResponse.json(
                error('NOT_FOUND', 'Aucun workspace trouvé'),
                { status: 404 }
            );
        }

        // Update the DNS status to MANUAL_OVERRIDE
        const statusField = `${recordType}Status` as 'spfStatus' | 'dkimStatus' | 'dmarcStatus';

        await prisma.workspace.update({
            where: { id: workspace.id },
            data: {
                [statusField]: 'MANUAL_OVERRIDE',
            },
        });

        console.log(`[DNS Override] ${recordType.toUpperCase()} manually overridden for workspace: ${workspace.id}`);

        return NextResponse.json(success({
            recordType,
            status: 'MANUAL_OVERRIDE',
            message: DNS_ERROR_MESSAGES.MANUAL_OVERRIDE_SUCCESS,
        }));
    } catch (e) {
        console.error('Error overriding DNS status:', e);
        return NextResponse.json(
            error('INTERNAL_ERROR', 'Erreur lors du remplacement manuel'),
            { status: 500 }
        );
    }
}
