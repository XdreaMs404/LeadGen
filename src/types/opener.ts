/**
 * Opener Types
 * Define types for opener cache data
 */

/**
 * Opener cache data structure
 */
export interface OpenerCacheData {
    id: string;
    workspaceId: string;
    prospectId: string;
    sequenceId: string;
    stepId: string;
    openerText: string;
    regenerationCount: number;
    regenerationsRemaining: number;
    createdAt: string;
    updatedAt: string;
}
