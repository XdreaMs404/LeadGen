/**
 * Campaign Status Update API Route
 * Story 5.6: Campaign Control (Pause/Resume/Stop Global)
 * 
 * POST /api/campaigns/[id]/status - Update campaign status (pause/resume/stop)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { StatusUpdateSchema } from '@/types/campaign-control';
import { updateCampaignStatus } from '@/lib/email-scheduler/campaign-control';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/campaigns/[id]/status
 * Update campaign status (pause, resume, or stop)
 * 
 * Body: { action: 'pause' | 'resume' | 'stop' }
 * 
 * Response:
 * - 200: { campaign, emailsCancelled? }
 * - 400: Validation error or invalid transition
 * - 401: Unauthorized
 * - 404: Campaign not found
 * - 500: Server error
 */
export async function POST(
    req: NextRequest,
    { params }: RouteParams
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                error('UNAUTHORIZED', 'Non authentifié'),
                { status: 401 }
            );
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const { id } = await params;
        const body = await req.json();

        // Validate request body
        const parsed = StatusUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Action invalide', parsed.error.flatten()),
                { status: 400 }
            );
        }

        const { action, acknowledgeRisk } = parsed.data;

        try {
            // Story 5.8: Handle resume with acknowledgment for auto-paused campaigns
            if (action === 'resume' && acknowledgeRisk !== undefined) {
                const { resumeAutoPausedCampaign } = await import('@/lib/email-scheduler/auto-pause');
                const campaign = await resumeAutoPausedCampaign(id, workspaceId, acknowledgeRisk);
                return NextResponse.json(success({ campaign }));
            }

            const result = await updateCampaignStatus(id, workspaceId, action);
            return NextResponse.json(success(result));
        } catch (e) {
            // Handle known errors (transitions, not found)
            if (e instanceof Error) {
                // Check if it's a "not found" error
                if (e.message.includes('non trouvée')) {
                    return NextResponse.json(
                        error('NOT_FOUND', e.message),
                        { status: 404 }
                    );
                }
                // Other business logic errors (invalid transitions)
                return NextResponse.json(
                    error('INVALID_TRANSITION', e.message),
                    { status: 400 }
                );
            }
            throw e;
        }
    } catch (e) {
        console.error('POST /api/campaigns/[id]/status error:', e);
        return NextResponse.json(
            error('INTERNAL_ERROR', 'Erreur serveur'),
            { status: 500 }
        );
    }
}
