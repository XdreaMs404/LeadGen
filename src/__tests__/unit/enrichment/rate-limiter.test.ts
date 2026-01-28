/**
 * Unit Tests: Rate Limiter
 * Story 3.5: Dropcontact Enrichment Integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    acquireDropcontactSlot,
    releaseDropcontactSlot,
    getActiveRequestCount,
    canMakeRequest,
    MAX_CONCURRENT_REQUESTS,
} from '@/lib/dropcontact/rate-limiter';

describe('Dropcontact Rate Limiter', () => {
    const testWorkspaceId = 'workspace-1';

    beforeEach(() => {
        // Reset rate limiter state by releasing all slots
        while (getActiveRequestCount(testWorkspaceId) > 0) {
            releaseDropcontactSlot(testWorkspaceId);
        }
    });

    describe('acquireDropcontactSlot', () => {
        it('should acquire slot when under limit', () => {
            const acquired = acquireDropcontactSlot(testWorkspaceId);
            expect(acquired).toBe(true);
            expect(getActiveRequestCount(testWorkspaceId)).toBe(1);
        });

        it('should allow multiple slots up to limit', () => {
            for (let i = 0; i < MAX_CONCURRENT_REQUESTS; i++) {
                expect(acquireDropcontactSlot(testWorkspaceId)).toBe(true);
            }
            expect(getActiveRequestCount(testWorkspaceId)).toBe(MAX_CONCURRENT_REQUESTS);
        });

        it('should reject when at limit', () => {
            for (let i = 0; i < MAX_CONCURRENT_REQUESTS; i++) {
                acquireDropcontactSlot(testWorkspaceId);
            }
            expect(acquireDropcontactSlot(testWorkspaceId)).toBe(false);
        });
    });

    describe('releaseDropcontactSlot', () => {
        it('should release slot', () => {
            acquireDropcontactSlot(testWorkspaceId);
            expect(getActiveRequestCount(testWorkspaceId)).toBe(1);

            releaseDropcontactSlot(testWorkspaceId);
            expect(getActiveRequestCount(testWorkspaceId)).toBe(0);
        });

        it('should not go below zero', () => {
            releaseDropcontactSlot(testWorkspaceId);
            expect(getActiveRequestCount(testWorkspaceId)).toBe(0);
        });

        it('should allow new slots after release', () => {
            for (let i = 0; i < MAX_CONCURRENT_REQUESTS; i++) {
                acquireDropcontactSlot(testWorkspaceId);
            }
            expect(acquireDropcontactSlot(testWorkspaceId)).toBe(false);

            releaseDropcontactSlot(testWorkspaceId);
            expect(acquireDropcontactSlot(testWorkspaceId)).toBe(true);
        });
    });

    describe('canMakeRequest', () => {
        it('should return true when under limit', () => {
            expect(canMakeRequest(testWorkspaceId)).toBe(true);
        });

        it('should return false when at limit', () => {
            for (let i = 0; i < MAX_CONCURRENT_REQUESTS; i++) {
                acquireDropcontactSlot(testWorkspaceId);
            }
            expect(canMakeRequest(testWorkspaceId)).toBe(false);
        });
    });

    describe('workspace isolation', () => {
        it('should track slots per workspace independently', () => {
            const workspace1 = 'ws-1';
            const workspace2 = 'ws-2';

            acquireDropcontactSlot(workspace1);
            acquireDropcontactSlot(workspace1);
            acquireDropcontactSlot(workspace2);

            expect(getActiveRequestCount(workspace1)).toBe(2);
            expect(getActiveRequestCount(workspace2)).toBe(1);

            // Cleanup
            releaseDropcontactSlot(workspace1);
            releaseDropcontactSlot(workspace1);
            releaseDropcontactSlot(workspace2);
        });
    });
});
