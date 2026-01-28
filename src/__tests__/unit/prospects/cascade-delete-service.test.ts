/**
 * Unit Tests for Cascade Delete Service
 * Story 3.6: Prospect Deletion with Cascade
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cascadeDeleteProspect, cascadeDeleteProspects } from '@/lib/prospects/cascade-delete-service';
import { prisma } from '@/lib/prisma/client';

// Mock Prisma client
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        enrichmentJob: {
            updateMany: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback({
            enrichmentJob: {
                updateMany: vi.fn().mockResolvedValue({ count: 2 }),
            },
        })),
    },
}));

describe('cascade-delete-service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('cascadeDeleteProspect', () => {
        it('should cancel pending enrichment jobs', async () => {
            const mockTx = {
                enrichmentJob: {
                    updateMany: vi.fn().mockResolvedValue({ count: 2 }),
                },
            };

            const result = await cascadeDeleteProspect('prospect-1', 'user-1', mockTx as any);

            expect(mockTx.enrichmentJob.updateMany).toHaveBeenCalledWith({
                where: {
                    prospectId: 'prospect-1',
                    status: { in: ['PENDING', 'IN_PROGRESS'] },
                },
                data: { status: 'CANCELLED' },
            });
            expect(result.enrichmentJobsCancelled).toBe(2);
        });

        it('should return zero counts for future Epic tables', async () => {
            const mockTx = {
                enrichmentJob: {
                    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
                },
            };

            const result = await cascadeDeleteProspect('prospect-1', 'user-1', mockTx as any);

            expect(result.emailsCancelled).toBe(0);
            expect(result.enrollmentsCancelled).toBe(0);
            expect(result.threadsArchived).toBe(0);
        });
    });

    describe('cascadeDeleteProspects', () => {
        it('should bulk cancel enrichment jobs for multiple prospects', async () => {
            const mockTx = {
                enrichmentJob: {
                    updateMany: vi.fn().mockResolvedValue({ count: 5 }),
                },
            };

            const result = await cascadeDeleteProspects(
                ['prospect-1', 'prospect-2', 'prospect-3'],
                'user-1',
                mockTx as any
            );

            expect(mockTx.enrichmentJob.updateMany).toHaveBeenCalledWith({
                where: {
                    prospectId: { in: ['prospect-1', 'prospect-2', 'prospect-3'] },
                    status: { in: ['PENDING', 'IN_PROGRESS'] },
                },
                data: { status: 'CANCELLED' },
            });
            expect(result.enrichmentJobsCancelled).toBe(5);
        });

        it('should return summary with all counts', async () => {
            const mockTx = {
                enrichmentJob: {
                    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
                },
            };

            const result = await cascadeDeleteProspects(['prospect-1'], 'user-1', mockTx as any);

            expect(result).toEqual({
                enrichmentJobsCancelled: 1,
                emailsCancelled: 0,
                enrollmentsCancelled: 0,
                threadsArchived: 0,
            });
        });
    });
});
