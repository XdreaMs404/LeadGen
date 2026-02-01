import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { success, error } from '@/lib/utils/api-response';
import { getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { checkPreLaunchRequirements } from '@/lib/guardrails/pre-launch-check';
import { z } from 'zod';

// Validation schema for pre-launch check request
const PreLaunchCheckSchema = z.object({
    sequenceId: z.string().min(1, 'Séquence requise'),
    prospectIds: z.array(z.string().min(1)).min(1, 'Sélectionnez au moins un prospect'),
});

/**
 * POST /api/campaigns/pre-launch-check - Check if campaign can be launched
 * Story 5.2: Campaign Launch Wizard with Pre-Launch Gating - AC4
 * 
 * Runs all pre-launch validations and returns detailed results.
 */
export async function POST(req: NextRequest) {
    try {
        // Authenticate user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);

        const body = await req.json();
        const parsed = PreLaunchCheckSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        const { sequenceId, prospectIds } = parsed.data;

        // Run pre-launch checks
        const result = await checkPreLaunchRequirements(workspaceId, sequenceId, prospectIds);

        return NextResponse.json(success(result));
    } catch (e) {
        console.error('POST /api/campaigns/pre-launch-check error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
