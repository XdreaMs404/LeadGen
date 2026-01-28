import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { checkCanSend } from '@/lib/guardrails/pre-send-check';
import { success, error } from '@/lib/utils/api-response';
import type { CanLaunchResponse } from '@/types/guardrails';

/**
 * GET /api/campaigns/check-launch
 * 
 * Checks if the current user can launch a campaign.
 * Used by frontend to enable/disable launch button.
 * 
 * @returns ApiResponse<CanLaunchResponse>
 */
export async function GET() {
    try {
        // Authenticate user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                error('UNAUTHORIZED', 'Non autorisé'),
                { status: 401 }
            );
        }

        // Get workspace from session (never from query params)
        const workspaceId = await getWorkspaceId(user.id);

        // Run pre-send checks
        const preSendResult = await checkCanSend(workspaceId);

        // Convert to CanLaunchResponse format
        const response: CanLaunchResponse = {
            canLaunch: preSendResult.canSend,
            blockedReason: preSendResult.blockedReason,
        };

        return NextResponse.json(success(response));
    } catch (err) {
        console.error('Campaign check-launch error:', err);

        const message = err instanceof Error ? err.message : 'Erreur interne du serveur';

        // Handle specific workspace not found error
        if (message === 'No workspace found for user') {
            return NextResponse.json(
                error('WORKSPACE_NOT_FOUND', 'Aucun espace de travail trouvé'),
                { status: 404 }
            );
        }

        return NextResponse.json(
            error('INTERNAL_ERROR', message),
            { status: 500 }
        );
    }
}
