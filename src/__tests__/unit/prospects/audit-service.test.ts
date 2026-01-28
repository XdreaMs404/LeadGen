/**
 * Unit Tests for Audit Service
 * Story 3.6: Prospect Deletion with Cascade
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuditLog, logProspectDeletion, logBulkProspectDeletion } from '@/lib/audit/audit-service';
import { prisma } from '@/lib/prisma/client';

// Mock Prisma client
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        auditLog: {
            create: vi.fn(),
        },
    },
}));

describe('audit-service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createAuditLog', () => {
        it('should create audit log entry with all fields', async () => {
            vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

            await createAuditLog({
                workspaceId: 'workspace-1',
                userId: 'user-1',
                action: 'PROSPECT_DELETED',
                entityType: 'PROSPECT',
                entityId: 'prospect-1',
                metadata: { test: true },
            });

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    workspaceId: 'workspace-1',
                    userId: 'user-1',
                    action: 'PROSPECT_DELETED',
                    entityType: 'PROSPECT',
                    entityId: 'prospect-1',
                    metadata: { test: true },
                },
            });
        });

        it('should create audit log without metadata', async () => {
            vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

            await createAuditLog({
                workspaceId: 'workspace-1',
                userId: 'user-1',
                action: 'CAMPAIGN_LAUNCHED',
                entityType: 'CAMPAIGN',
                entityId: 'campaign-1',
            });

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: 'CAMPAIGN_LAUNCHED',
                    metadata: undefined,
                }),
            });
        });
    });

    describe('logProspectDeletion', () => {
        it('should log prospect deletion with cascade summary', async () => {
            vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

            const cascadeSummary = {
                enrichmentJobsCancelled: 2,
                emailsCancelled: 0,
                enrollmentsCancelled: 0,
                threadsArchived: 0,
            };

            await logProspectDeletion('prospect-1', 'user-1', 'workspace-1', cascadeSummary);

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: 'PROSPECT_DELETED',
                    entityType: 'PROSPECT',
                    entityId: 'prospect-1',
                    metadata: expect.objectContaining({
                        cascade: expect.objectContaining({
                            enrichmentJobsCancelled: 2,
                        }),
                        deletedAt: expect.any(String),
                    }),
                }),
            });
        });
    });

    describe('logBulkProspectDeletion', () => {
        it('should log bulk deletion with prospect IDs and count', async () => {
            vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

            const cascadeSummary = {
                enrichmentJobsCancelled: 5,
                emailsCancelled: 0,
                enrollmentsCancelled: 0,
                threadsArchived: 0,
            };

            await logBulkProspectDeletion(
                ['prospect-1', 'prospect-2', 'prospect-3'],
                'user-1',
                'workspace-1',
                cascadeSummary
            );

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: 'PROSPECT_BULK_DELETED',
                    entityId: 'prospect-1,prospect-2,prospect-3',
                    metadata: expect.objectContaining({
                        count: 3,
                        prospectIds: ['prospect-1', 'prospect-2', 'prospect-3'],
                    }),
                }),
            });
        });
    });
});
