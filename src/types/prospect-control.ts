/**
 * Prospect Control Types
 * Story 5.7: Individual Lead Control within Campaign
 */

import { z } from 'zod';
import { EnrollmentStatus } from '@prisma/client';
import { CampaignProspectResponse } from './campaign';

// Re-export for convenience
export { EnrollmentStatus };

/**
 * Actions that can be performed on a prospect enrollment
 */
export type ProspectAction = 'pause' | 'resume' | 'stop';

/**
 * Zod schema for prospect status update validation
 */
export const ProspectStatusUpdateSchema = z.object({
    action: z.enum(['pause', 'resume', 'stop']),
});

export type ProspectStatusUpdateRequest = z.infer<typeof ProspectStatusUpdateSchema>;

/**
 * Response after a prospect status update
 */
export interface ProspectStatusUpdateResponse {
    prospect: CampaignProspectResponse;
    emailsCancelled?: number; // Only for stop action
}

/**
 * Result of stopping a prospect
 */
export interface StopProspectResult {
    prospect: CampaignProspectResponse;
    emailsCancelled: number;
}

/**
 * Valid state transitions matrix
 * current_status -> allowed actions
 */
export const VALID_PROSPECT_TRANSITIONS: Record<EnrollmentStatus, ProspectAction[]> = {
    ENROLLED: ['pause', 'stop'],
    PAUSED: ['resume', 'stop'],
    COMPLETED: [],
    STOPPED: [],
    REPLIED: [],
};

/**
 * Get the target status for an action
 */
export function getProspectTargetStatus(action: ProspectAction): EnrollmentStatus {
    switch (action) {
        case 'pause':
            return EnrollmentStatus.PAUSED;
        case 'resume':
            return EnrollmentStatus.ENROLLED;
        case 'stop':
            return EnrollmentStatus.STOPPED;
    }
}

/**
 * Check if a prospect transition is valid
 */
export function isValidProspectTransition(
    currentStatus: EnrollmentStatus,
    action: ProspectAction
): boolean {
    const allowedActions = VALID_PROSPECT_TRANSITIONS[currentStatus];
    return allowedActions.includes(action);
}

/**
 * Get error message for invalid prospect transition
 */
export function getProspectTransitionError(
    currentStatus: EnrollmentStatus,
    action: ProspectAction
): string {
    const statusLabels: Record<EnrollmentStatus, string> = {
        ENROLLED: 'actif',
        PAUSED: 'en pause',
        COMPLETED: 'terminé',
        STOPPED: 'arrêté',
        REPLIED: 'a répondu',
    };

    const actionLabels: Record<ProspectAction, string> = {
        pause: 'mettre en pause',
        resume: 'reprendre',
        stop: 'arrêter',
    };

    return `Impossible de ${actionLabels[action]} un prospect ${statusLabels[currentStatus]}`;
}
