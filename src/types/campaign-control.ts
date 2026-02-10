/**
 * Campaign Control Types
 * Story 5.6: Campaign Control (Pause/Resume/Stop Global)
 */

import { z } from 'zod';
import { CampaignStatus } from '@prisma/client';
import { CampaignResponse } from './campaign';

// Re-export for convenience
export { CampaignStatus };

/**
 * Actions that can be performed on a campaign
 */
export type CampaignAction = 'pause' | 'resume' | 'stop';

/**
 * Zod schema for status update validation
 */
export const StatusUpdateSchema = z.object({
    action: z.enum(['pause', 'resume', 'stop']),
    acknowledgeRisk: z.boolean().optional(), // Story 5.8: Required for resume after auto-pause
});

export type StatusUpdateRequest = z.infer<typeof StatusUpdateSchema>;

/**
 * Response after a status update
 */
export interface StatusUpdateResponse {
    campaign: CampaignResponse;
    emailsCancelled?: number; // Only for stop action
}

/**
 * Result of stopping a campaign
 */
export interface StopResult {
    campaign: CampaignResponse;
    emailsCancelled: number;
}

/**
 * Valid state transitions matrix
 * current_status -> allowed actions
 */
export const VALID_TRANSITIONS: Record<CampaignStatus, CampaignAction[]> = {
    DRAFT: [],
    RUNNING: ['pause', 'stop'],
    PAUSED: ['resume', 'stop'],
    STOPPED: [],
    COMPLETED: [],
};

/**
 * Get the target status for an action
 */
export function getTargetStatus(action: CampaignAction): CampaignStatus {
    switch (action) {
        case 'pause':
            return CampaignStatus.PAUSED;
        case 'resume':
            return CampaignStatus.RUNNING;
        case 'stop':
            return CampaignStatus.STOPPED;
    }
}

/**
 * Check if a transition is valid
 */
export function isValidTransition(
    currentStatus: CampaignStatus,
    action: CampaignAction
): boolean {
    const allowedActions = VALID_TRANSITIONS[currentStatus];
    return allowedActions.includes(action);
}

/**
 * Get error message for invalid transition
 */
export function getTransitionError(
    currentStatus: CampaignStatus,
    action: CampaignAction
): string {
    const statusLabels: Record<CampaignStatus, string> = {
        DRAFT: 'en brouillon',
        RUNNING: 'en cours',
        PAUSED: 'en pause',
        STOPPED: 'arrêtée',
        COMPLETED: 'terminée',
    };

    const actionLabels: Record<CampaignAction, string> = {
        pause: 'mettre en pause',
        resume: 'reprendre',
        stop: 'arrêter',
    };

    return `Impossible de ${actionLabels[action]} une campagne ${statusLabels[currentStatus]}`;
}
