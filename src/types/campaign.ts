/**
 * Campaign Types
 * Story 5.1: Campaign Entity & Status Model
 */

import { CampaignStatus, EnrollmentStatus } from '@prisma/client';

// Re-export Prisma enums for TypeScript usage
export { CampaignStatus, EnrollmentStatus };

/**
 * Campaign response for API endpoints
 */
export interface CampaignResponse {
    id: string;
    workspaceId: string;
    name: string;
    sequenceId: string;
    status: CampaignStatus;
    createdAt: string;
    startedAt: string | null;
    pausedAt: string | null;
    completedAt: string | null;
    stoppedAt: string | null;
    // Computed fields from joins
    enrollmentCounts?: {
        total: number;
        enrolled: number;
        paused: number;
        completed: number;
        stopped: number;
        replied: number;
    };
    sequence?: {
        id: string;
        name: string;
    };
}

/**
 * Campaign prospect enrollment response
 */
export interface CampaignProspectResponse {
    id: string;
    campaignId: string;
    prospectId: string;
    enrollmentStatus: EnrollmentStatus;
    currentStep: number;
    enrolledAt: string;
    pausedAt: string | null;
    completedAt: string | null;
    prospect?: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        company: string | null;
    };
}

/**
 * Input for creating a new campaign
 */
export interface CreateCampaignInput {
    name: string;
    sequenceId?: string; // Optional at creation, set during launch wizard
}


/**
 * Input for updating campaign name
 */
export interface UpdateCampaignInput {
    name: string;
}
