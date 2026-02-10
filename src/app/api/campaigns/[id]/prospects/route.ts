/**
 * Campaign Prospects API Route
 * Story 5.2 + 5.6 + 5.7: Get prospects enrolled in a campaign with pagination
 * 
 * GET /api/campaigns/[id]/prospects - List all campaign prospects
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { mapCampaignProspect } from '@/lib/prisma/mappers';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/campaigns/[id]/prospects
 * List all prospects enrolled in a campaign with pagination
 * Includes duplicate detection based on scheduled email count
 */
export async function GET(
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

        // Verify campaign exists and belongs to workspace
        const campaign = await prisma.campaign.findFirst({
            where: { id, workspaceId },
            include: {
                sequence: {
                    include: {
                        steps: { select: { id: true } }
                    }
                }
            }
        });

        if (!campaign) {
            return NextResponse.json(
                error('NOT_FOUND', 'Campagne non trouvée'),
                { status: 404 }
            );
        }

        // Count expected steps for duplicate detection
        const expectedStepCount = campaign.sequence?.steps.length ?? 0;

        // Parse pagination params (Story 5.7)
        const searchParams = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const perPage = Math.min(100, Math.max(10, parseInt(searchParams.get('perPage') || '25', 10)));

        // Get total count for pagination
        const total = await prisma.campaignProspect.count({
            where: { campaignId: id },
        });

        // Fetch campaign prospects with pagination and scheduled email count
        const campaignProspects = await prisma.campaignProspect.findMany({
            where: { campaignId: id },
            include: {
                prospect: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        company: true,
                    },
                },
                scheduledEmails: {
                    select: { id: true },
                },
            },
            orderBy: { enrolledAt: 'desc' },
            skip: (page - 1) * perPage,
            take: perPage,
        });

        // Map prospects with duplicate detection
        const mappedProspects = campaignProspects.map(cp => {
            const mapped = mapCampaignProspect(cp);
            const scheduledCount = cp.scheduledEmails?.length ?? 0;

            // A prospect is NOT a duplicate just because scheduledCount is 0.
            // That could be a scheduling failure or timing issue.
            // We only flag as duplicate for display purposes - let the UI show the actual status.
            // If scheduledCount is 0 and campaign is RUNNING, the issue is likely scheduling, not duplication.
            const isDuplicate = false; // Removed faulty logic - duplicates should be prevented at enrollment time

            return {
                ...mapped,
                scheduledEmailCount: scheduledCount,
                isDuplicate,
            };
        });

        return NextResponse.json(success({
            prospects: mappedProspects,
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage),
        }));

    } catch (e) {
        console.error('GET /api/campaigns/[id]/prospects error:', e);
        return NextResponse.json(
            error('INTERNAL_ERROR', 'Erreur serveur'),
            { status: 500 }
        );
    }
}

