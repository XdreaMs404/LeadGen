/**
 * Unit Tests: Campaign Prospect Filter
 * Story 3.5: Dropcontact Enrichment Integration (AC5)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { filterVerifiedProspects, canSendToProspect, STATUS_EXCLUSION_REASONS } from '@/lib/guardrails/campaign-prospect-filter';
import { prisma } from '@/lib/prisma/client';

// Mock Prisma
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        prospect: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
        },
    },
}));

const mockPrisma = vi.mocked(prisma);

describe('Campaign Prospect Filter', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('filterVerifiedProspects', () => {
        const workspaceId = 'ws-123';

        it('should return empty arrays for empty input', async () => {
            const result = await filterVerifiedProspects([], workspaceId);

            expect(result.verifiedIds).toEqual([]);
            expect(result.excluded).toEqual([]);
            expect(result.summary.total).toBe(0);
        });

        it('should include only VERIFIED prospects', async () => {
            mockPrisma.prospect.findMany.mockResolvedValueOnce([
                { id: 'p1', email: 'verified@test.com', status: 'VERIFIED' },
                { id: 'p2', email: 'new@test.com', status: 'NEW' },
                { id: 'p3', email: 'verified2@test.com', status: 'VERIFIED' },
            ] as any);

            const result = await filterVerifiedProspects(['p1', 'p2', 'p3'], workspaceId);

            expect(result.verifiedIds).toEqual(['p1', 'p3']);
            expect(result.excluded).toHaveLength(1);
            expect(result.excluded[0].prospectId).toBe('p2');
            expect(result.summary.verified).toBe(2);
            expect(result.summary.excluded).toBe(1);
        });

        it('should provide exclusion reasons for each status', async () => {
            mockPrisma.prospect.findMany.mockResolvedValueOnce([
                { id: 'p1', email: 'not-verified@test.com', status: 'NOT_VERIFIED' },
                { id: 'p2', email: 'needs-review@test.com', status: 'NEEDS_REVIEW' },
                { id: 'p3', email: 'bounced@test.com', status: 'BOUNCED' },
            ] as any);

            const result = await filterVerifiedProspects(['p1', 'p2', 'p3'], workspaceId);

            expect(result.excluded).toHaveLength(3);
            expect(result.excluded[0].reason).toBe(STATUS_EXCLUSION_REASONS['NOT_VERIFIED']);
            expect(result.excluded[1].reason).toBe(STATUS_EXCLUSION_REASONS['NEEDS_REVIEW']);
            expect(result.excluded[2].reason).toBe(STATUS_EXCLUSION_REASONS['BOUNCED']);
        });

        it('should pass workspaceId to query', async () => {
            mockPrisma.prospect.findMany.mockResolvedValueOnce([]);

            await filterVerifiedProspects(['p1'], workspaceId);

            expect(mockPrisma.prospect.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        workspaceId,
                    }),
                })
            );
        });
    });

    describe('canSendToProspect', () => {
        const workspaceId = 'ws-123';

        it('should allow sending to VERIFIED prospect', async () => {
            mockPrisma.prospect.findFirst.mockResolvedValueOnce({
                status: 'VERIFIED',
            } as any);

            const result = await canSendToProspect('p1', workspaceId);

            expect(result.canSend).toBe(true);
            expect(result.reason).toBeUndefined();
        });

        it('should reject sending to NOT_VERIFIED prospect', async () => {
            mockPrisma.prospect.findFirst.mockResolvedValueOnce({
                status: 'NOT_VERIFIED',
            } as any);

            const result = await canSendToProspect('p1', workspaceId);

            expect(result.canSend).toBe(false);
            expect(result.reason).toBe(STATUS_EXCLUSION_REASONS['NOT_VERIFIED']);
        });

        it('should reject sending to NEW prospect', async () => {
            mockPrisma.prospect.findFirst.mockResolvedValueOnce({
                status: 'NEW',
            } as any);

            const result = await canSendToProspect('p1', workspaceId);

            expect(result.canSend).toBe(false);
            expect(result.reason).toBe(STATUS_EXCLUSION_REASONS['NEW']);
        });

        it('should return not found for missing prospect', async () => {
            mockPrisma.prospect.findFirst.mockResolvedValueOnce(null);

            const result = await canSendToProspect('non-existent', workspaceId);

            expect(result.canSend).toBe(false);
            expect(result.reason).toBe('Prospect non trouvé');
        });
    });

    describe('STATUS_EXCLUSION_REASONS', () => {
        it('should have French descriptions for all statuses', () => {
            expect(STATUS_EXCLUSION_REASONS['NEW']).toBeTruthy();
            expect(STATUS_EXCLUSION_REASONS['ENRICHING']).toBeTruthy();
            expect(STATUS_EXCLUSION_REASONS['NOT_VERIFIED']).toBeTruthy();
            expect(STATUS_EXCLUSION_REASONS['NEEDS_REVIEW']).toBeTruthy();
            expect(STATUS_EXCLUSION_REASONS['VERIFIED']).toBe(''); // Not excluded
        });
    });
});
