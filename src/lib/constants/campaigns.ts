/**
 * Campaign Constants
 * Story 5.1: Campaign Entity & Status Model
 */

import { CampaignStatus, EnrollmentStatus } from '@prisma/client';

/**
 * Campaign status labels for UI display (French)
 */
export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
    [CampaignStatus.DRAFT]: 'Brouillon',
    [CampaignStatus.RUNNING]: 'En cours',
    [CampaignStatus.PAUSED]: 'En pause',
    [CampaignStatus.COMPLETED]: 'Terminée',
    [CampaignStatus.STOPPED]: 'Arrêtée',
};

/**
 * Enrollment status labels for UI display (French)
 */
export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
    [EnrollmentStatus.ENROLLED]: 'Inscrit',
    [EnrollmentStatus.PAUSED]: 'En pause',
    [EnrollmentStatus.COMPLETED]: 'Terminé',
    [EnrollmentStatus.STOPPED]: 'Arrêté',
    [EnrollmentStatus.REPLIED]: 'Répondu',
};

/**
 * Allowed campaign status transitions
 * Key: current status, Value: array of allowed target statuses
 * Note: Status transitions will be enforced in Story 5.6
 */
export const ALLOWED_CAMPAIGN_STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
    [CampaignStatus.DRAFT]: [CampaignStatus.RUNNING],
    [CampaignStatus.RUNNING]: [CampaignStatus.PAUSED, CampaignStatus.STOPPED, CampaignStatus.COMPLETED],
    [CampaignStatus.PAUSED]: [CampaignStatus.RUNNING, CampaignStatus.STOPPED],
    [CampaignStatus.COMPLETED]: [], // Terminal state
    [CampaignStatus.STOPPED]: [], // Terminal state
};

/**
 * Allowed enrollment status transitions
 * Key: current status, Value: array of allowed target statuses
 */
export const ALLOWED_ENROLLMENT_STATUS_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
    [EnrollmentStatus.ENROLLED]: [EnrollmentStatus.PAUSED, EnrollmentStatus.COMPLETED, EnrollmentStatus.STOPPED, EnrollmentStatus.REPLIED],
    [EnrollmentStatus.PAUSED]: [EnrollmentStatus.ENROLLED, EnrollmentStatus.STOPPED],
    [EnrollmentStatus.COMPLETED]: [], // Terminal state
    [EnrollmentStatus.STOPPED]: [], // Terminal state
    [EnrollmentStatus.REPLIED]: [EnrollmentStatus.COMPLETED, EnrollmentStatus.STOPPED], // Can still complete after reply
};

/**
 * Campaign status color variants for badges
 */
export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    [CampaignStatus.DRAFT]: 'outline',
    [CampaignStatus.RUNNING]: 'default',
    [CampaignStatus.PAUSED]: 'secondary',
    [CampaignStatus.COMPLETED]: 'default',
    [CampaignStatus.STOPPED]: 'destructive',
};

/**
 * Enrollment status color variants for badges
 */
export const ENROLLMENT_STATUS_COLORS: Record<EnrollmentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    [EnrollmentStatus.ENROLLED]: 'default',
    [EnrollmentStatus.PAUSED]: 'secondary',
    [EnrollmentStatus.COMPLETED]: 'default',
    [EnrollmentStatus.STOPPED]: 'destructive',
    [EnrollmentStatus.REPLIED]: 'default',
};
