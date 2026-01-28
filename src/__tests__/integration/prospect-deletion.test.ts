/**
 * Integration Tests for Prospect Deletion API (Story 3.6)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from '@/app/api/prospects/[id]/route';
import { POST } from '@/app/api/prospects/bulk-delete/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        prospect: {
            findUnique: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn(),
            updateMany: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback({
            prospect: {
                update: vi.fn(),
                updateMany: vi.fn(),
            },
            enrichmentJob: {
                updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
        })),
    },
}));

vi.mock('@/lib/guardrails/workspace-check', () => ({
    getWorkspaceId: vi.fn(),
    assertWorkspaceAccess: vi.fn(),
}));

vi.mock('@/lib/audit/audit-service', () => ({
    logProspectDeletion: vi.fn(),
    logBulkProspectDeletion: vi.fn(),
}));

vi.mock('@/lib/prospects/cascade-delete-service', () => ({
    cascadeDeleteProspect: vi.fn().mockResolvedValue({ enrichmentJobsCancelled: 1 }),
    cascadeDeleteProspects: vi.fn().mockResolvedValue({ enrichmentJobsCancelled: 2 }),
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { getWorkspaceId, assertWorkspaceAccess } from '@/lib/guardrails/workspace-check';

const mockCreateClient = vi.mocked(createClient);
const mockPrisma = vi.mocked(prisma);
const mockGetWorkspaceId = vi.mocked(getWorkspaceId);
const mockAssertWorkspaceAccess = vi.mocked(assertWorkspaceAccess);

describe('Prospect Deletion API', () => {
    const mockUser = { id: 'user-123' };
    const mockWorkspaceId = 'workspace-456';
    const mockProspectId = 'prospect-789';

    beforeEach(() => {
        vi.clearAllMocks();

        mockCreateClient.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
            },
        } as unknown as Awaited<ReturnType<typeof createClient>>);

        mockGetWorkspaceId.mockResolvedValue(mockWorkspaceId);
        mockAssertWorkspaceAccess.mockResolvedValue(undefined);
    });

    describe('DELETE /api/prospects/[id]', () => {
        it('soft deletes prospect and returns cascade summary', async () => {
            const mockProspect = {
                id: mockProspectId,
                workspaceId: mockWorkspaceId,
                deletedAt: null,
            };

            (mockPrisma.prospect.findUnique as any).mockResolvedValue(mockProspect);

            const req = new NextRequest(`http://localhost:3000/api/prospects/${mockProspectId}`, {
                method: 'DELETE',
            });

            const response = await DELETE(req, { params: Promise.resolve({ id: mockProspectId }) });
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.data.deleted).toBe(true);
            // Verify Prisma transaction was called (via mock implementation)
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('returns 404 if prospect not found', async () => {
            (mockPrisma.prospect.findUnique as any).mockResolvedValue(null);

            const req = new NextRequest(`http://localhost:3000/api/prospects/${mockProspectId}`, {
                method: 'DELETE',
            });

            const response = await DELETE(req, { params: Promise.resolve({ id: mockProspectId }) });
            expect(response.status).toBe(404);
        });

        it('returns 400 if already deleted', async () => {
            (mockPrisma.prospect.findUnique as any).mockResolvedValue({
                id: mockProspectId,
                workspaceId: mockWorkspaceId,
                deletedAt: new Date(),
            });

            const req = new NextRequest(`http://localhost:3000/api/prospects/${mockProspectId}`, {
                method: 'DELETE',
            });

            const response = await DELETE(req, { params: Promise.resolve({ id: mockProspectId }) });
            const json = await response.json();

            expect(response.status).toBe(400);
            expect(json.error.code).toBe('ALREADY_DELETED');
        });
    });

    describe('POST /api/prospects/bulk-delete', () => {
        it('bulk deletes prospects', async () => {
            const prospectIds = ['cuid11111111111111111111', 'cuid22222222222222222222'];

            (mockPrisma.prospect.findMany as any).mockResolvedValue([
                { id: 'cuid11111111111111111111' }, { id: 'cuid22222222222222222222' }
            ]);

            const req = new NextRequest('http://localhost:3000/api/prospects/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prospectIds }),
            });

            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.data.deleted).toBe(2);
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('returns 400 for empty selection', async () => {
            (mockPrisma.prospect.findMany as any).mockResolvedValue([]);
            const validCuid = 'cuid11111111111111111111';

            const req = new NextRequest('http://localhost:3000/api/prospects/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prospectIds: [validCuid] }),
            });

            const response = await POST(req);
            expect(response.status).toBe(400);
        });
    });
});
