/**
 * Rate Limiter for Dropcontact API
 * Limits concurrent requests per workspace to prevent API abuse
 */

const WORKSPACE_CONCURRENT_LIMIT = 10;

// In-memory tracking of active requests per workspace
// Note: In production with multiple instances, this should use Redis
const workspaceActiveRequests = new Map<string, number>();

/**
 * Attempt to acquire a slot for a Dropcontact API request
 * @param workspaceId - The workspace making the request
 * @returns true if a slot was acquired, false if rate limited
 */
export function acquireDropcontactSlot(workspaceId: string): boolean {
    const current = workspaceActiveRequests.get(workspaceId) || 0;
    if (current >= WORKSPACE_CONCURRENT_LIMIT) {
        return false;
    }
    workspaceActiveRequests.set(workspaceId, current + 1);
    return true;
}

/**
 * Release a slot after a Dropcontact API request completes
 * @param workspaceId - The workspace that made the request
 */
export function releaseDropcontactSlot(workspaceId: string): void {
    const current = workspaceActiveRequests.get(workspaceId) || 1;
    workspaceActiveRequests.set(workspaceId, Math.max(0, current - 1));
}

/**
 * Get current active request count for a workspace
 * @param workspaceId - The workspace to check
 * @returns Current number of active requests
 */
export function getActiveRequestCount(workspaceId: string): number {
    return workspaceActiveRequests.get(workspaceId) || 0;
}

/**
 * Check if a workspace can make more requests
 * @param workspaceId - The workspace to check
 * @returns true if under the limit
 */
export function canMakeRequest(workspaceId: string): boolean {
    const current = workspaceActiveRequests.get(workspaceId) || 0;
    return current < WORKSPACE_CONCURRENT_LIMIT;
}

/**
 * Get the maximum concurrent requests allowed per workspace
 */
export const MAX_CONCURRENT_REQUESTS = WORKSPACE_CONCURRENT_LIMIT;
