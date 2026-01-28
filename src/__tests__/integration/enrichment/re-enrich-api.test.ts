/**
 * Integration Tests: Re-Enrich API Endpoint
 * Story 3.5: Dropcontact Enrichment Integration (AC8)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        prospect: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        enrichmentJob: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
    },
}));

vi.mock('@/lib/guardrails/workspace-check', () => ({
    assertWorkspaceAccess: vi.fn(),
    getWorkspaceId: vi.fn(),
}));

vi.mock('@/lib/enrichment/enrichment-service', () => ({
    queueEnrichment: vi.fn(),
}));

import { POST } from '@/app/api/prospects/[id]/enrich/route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { getWorkspaceId, assertWorkspaceAccess } from '@/lib/guardrails/workspace-check';
import { queueEnrichment } from '@/lib/enrichment/enrichment-service';

const mockCreateClient = vi.mocked(createClient);
const mockPrisma = vi.mocked(prisma);
const mockGetWorkspaceId = vi.mocked(getWorkspaceId);
const mockAssertWorkspaceAccess = vi.mocked(assertWorkspaceAccess);
const mockQueueEnrichment = vi.mocked(queueEnrichment);

describe('POST /api/prospects/[id]/enrich', () => {
    const mockUser = { id: 'user-123', email: 'test@test.com' };
    const mockWorkspaceId = 'ws-123';

    beforeEach(() => {
        vi.resetAllMocks();

        mockCreateClient.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
            },
        } as any);

        mockGetWorkspaceId.mockResolvedValue(mockWorkspaceId);
        mockAssertWorkspaceAccess.mockResolvedValue(undefined);
    });

    function createRequest(prospectId: string): NextRequest {
        return new NextRequest(`http://localhost:3000/api/prospects/${prospectId}/enrich`, {
            method: 'POST',
        });
    }

    it('should queue re-enrichment for NEEDS_REVIEW prospect', async () => {
        const prospectId = 'p-123';
        const jobId = 'job-456';

        mockPrisma.prospect.findFirst.mockResolvedValueOnce({
            id: prospectId,
            workspaceId: mockWorkspaceId,
            status: 'NEEDS_REVIEW',
        } as any);

        mockPrisma.prospect.update.mockResolvedValueOnce({} as any);
        mockQueueEnrichment.mockResolvedValueOnce({ id: jobId } as any);

        const response = await POST(createRequest(prospectId), {
            params: Promise.resolve({ id: prospectId }),
        });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data.jobId).toBe(jobId);
        expect(mockQueueEnrichment).toHaveBeenCalledWith(prospectId, mockWorkspaceId);
    });

    it('should queue re-enrichment for NOT_VERIFIED prospect', async () => {
        const prospectId = 'p-123';

        mockPrisma.prospect.findFirst.mockResolvedValueOnce({
            id: prospectId,
            workspaceId: mockWorkspaceId,
            status: 'NOT_VERIFIED',
        } as any);

        mockPrisma.prospect.update.mockResolvedValueOnce({} as any);
        mockQueueEnrichment.mockResolvedValueOnce({ id: 'job-789' } as any);

        const response = await POST(createRequest(prospectId), {
            params: Promise.resolve({ id: prospectId }),
        });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
    });

    it('should reject re-enrichment for VERIFIED prospect', async () => {
        const prospectId = 'p-123';

        mockPrisma.prospect.findFirst.mockResolvedValueOnce({
            id: prospectId,
            workspaceId: mockWorkspaceId,
            status: 'VERIFIED',
        } as any);

        const response = await POST(createRequest(prospectId), {
            params: Promise.resolve({ id: prospectId }),
        });
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.error.code).toBe('INVALID_STATUS');
        expect(mockQueueEnrichment).not.toHaveBeenCalled();
    });

    it('should reject re-enrichment for NEW prospect', async () => {
        const prospectId = 'p-123';

        mockPrisma.prospect.findFirst.mockResolvedValueOnce({
            id: prospectId,
            workspaceId: mockWorkspaceId,
            status: 'NEW',
        } as any);

        const response = await POST(createRequest(prospectId), {
            params: Promise.resolve({ id: prospectId }),
        });
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.success).toBe(false);
    });

    it('should return 404 for non-existent prospect', async () => {
        mockPrisma.prospect.findFirst.mockResolvedValueOnce(null);

        const response = await POST(createRequest('non-existent'), {
            params: Promise.resolve({ id: 'non-existent' }),
        });
        const json = await response.json();

        expect(response.status).toBe(404);
        expect(json.success).toBe(false);
        expect(json.error.code).toBe('NOT_FOUND');
    });

    it('should return 401 for unauthenticated user', async () => {
        mockCreateClient.mockResolvedValueOnce({
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            },
        } as any);

        const response = await POST(createRequest('p-123'), {
            params: Promise.resolve({ id: 'p-123' }),
        });
        const json = await response.json();

        expect(response.status).toBe(401);
        expect(json.success).toBe(false);
    });
});
