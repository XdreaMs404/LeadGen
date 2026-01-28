/**
 * Campaign Prospect Filter (Guardrails)
 * Story 3.5 - Task 9 (AC5): Filter for verified prospects only
 * 
 * This is a guardrail helper for use in Campaign Launch (Epic 5)
 * Only VERIFIED prospects can be included in campaigns
 */

import { prisma } from '@/lib/prisma/client';
import type { ProspectStatus } from '@prisma/client';

interface FilterResult {
    /** IDs of prospects that can be included in campaigns */
    verifiedIds: string[];
    /** Prospects excluded with their reasons */
    excluded: Array<{
        prospectId: string;
        email: string;
        status: ProspectStatus;
        reason: string;
    }>;
    /** Summary stats */
    summary: {
        total: number;
        verified: number;
        excluded: number;
    };
}

// Status explanations in French
const STATUS_EXCLUSION_REASONS: Record<ProspectStatus, string> = {
    NEW: 'Prospect non encore enrichi',
    ENRICHING: 'Enrichissement en cours',
    VERIFIED: '', // Not excluded
    NOT_VERIFIED: 'Email non vérifié par Dropcontact',
    NEEDS_REVIEW: 'À revoir - l\'enrichissement a échoué',
    SUPPRESSED: 'Prospect supprimé de la liste',
    CONTACTED: 'Prospect déjà contacté',
    REPLIED: 'Prospect a déjà répondu',
    BOUNCED: 'Email en erreur (bounce)',
    UNSUBSCRIBED: 'Prospect désabonné',
    BOOKED: 'RDV déjà pris',
};

/**
 * Filter prospect IDs to only include VERIFIED prospects
 * Returns excluded prospects with reasons for UI display
 * 
 * @param prospectIds - Array of prospect IDs to filter
 * @param workspaceId - Workspace ID to verify ownership
 * @returns FilterResult with verified IDs and exclusion details
 */
export async function filterVerifiedProspects(
    prospectIds: string[],
    workspaceId: string
): Promise<FilterResult> {
    if (prospectIds.length === 0) {
        return {
            verifiedIds: [],
            excluded: [],
            summary: { total: 0, verified: 0, excluded: 0 },
        };
    }

    // Fetch prospects with their statuses
    const prospects = await prisma.prospect.findMany({
        where: {
            id: { in: prospectIds },
            workspaceId,
        },
        select: {
            id: true,
            email: true,
            status: true,
        },
    });

    const verifiedIds: string[] = [];
    const excluded: FilterResult['excluded'] = [];

    for (const prospect of prospects) {
        if (prospect.status === 'VERIFIED') {
            verifiedIds.push(prospect.id);
        } else {
            excluded.push({
                prospectId: prospect.id,
                email: prospect.email,
                status: prospect.status,
                reason: STATUS_EXCLUSION_REASONS[prospect.status] || 'Statut non autorisé',
            });
        }
    }

    return {
        verifiedIds,
        excluded,
        summary: {
            total: prospects.length,
            verified: verifiedIds.length,
            excluded: excluded.length,
        },
    };
}

/**
 * Check if a single prospect can be included in campaigns
 * @param prospectId - Prospect ID to check
 * @param workspaceId - Workspace ID
 * @returns Object with canSend boolean and reason if not
 */
export async function canSendToProspect(
    prospectId: string,
    workspaceId: string
): Promise<{ canSend: boolean; reason?: string }> {
    const prospect = await prisma.prospect.findFirst({
        where: {
            id: prospectId,
            workspaceId,
        },
        select: {
            status: true,
        },
    });

    if (!prospect) {
        return { canSend: false, reason: 'Prospect non trouvé' };
    }

    if (prospect.status === 'VERIFIED') {
        return { canSend: true };
    }

    return {
        canSend: false,
        reason: STATUS_EXCLUSION_REASONS[prospect.status] || 'Statut non autorisé pour l\'envoi',
    };
}

export { STATUS_EXCLUSION_REASONS };
