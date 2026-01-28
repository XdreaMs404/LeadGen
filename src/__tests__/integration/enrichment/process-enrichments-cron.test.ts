/**
 * Integration Tests: Process Enrichments Cron
 * Story 3.5: Dropcontact Enrichment Integration (AC1, AC2, AC3, AC7)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        enrichmentJob: {
            findMany: vi.fn(),
        },
    },
}));

vi.mock('@/lib/enrichment/enrichment-service', () => ({
    processEnrichmentJob: vi.fn(),
    submitEnrichmentBatch: vi.fn(),
}));

vi.mock('@/lib/dropcontact/rate-limiter', () => ({
    canMakeRequest: vi.fn(),
}));

import { GET } from '@/app/api/cron/process-enrichments/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { processEnrichmentJob, submitEnrichmentBatch } from '@/lib/enrichment/enrichment-service';
import { canMakeRequest } from '@/lib/dropcontact/rate-limiter';

const mockPrisma = vi.mocked(prisma);
const mockProcessEnrichmentJob = vi.mocked(processEnrichmentJob);
const mockSubmitEnrichmentBatch = vi.mocked(submitEnrichmentBatch);
const mockCanMakeRequest = vi.mocked(canMakeRequest);

describe('GET /api/cron/process-enrichments', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockCanMakeRequest.mockReturnValue(true);
    });

    function createRequest(withSecret = true): NextRequest {
        const headers = new Headers();
        if (withSecret) {
            headers.set('authorization', `Bearer ${process.env.CRON_SECRET}`);
        }
        return new NextRequest('http://localhost:3000/api/cron/process-enrichments', {
            method: 'GET',
            headers,
        });
    }

    it('should process pending jobs successfully (batch)', async () => {
        const mockJobs = [
            { id: 'job-1', workspaceId: 'ws-1', prospect: { id: 'p-1' }, status: 'PENDING' },
            { id: 'job-2', workspaceId: 'ws-1', prospect: { id: 'p-2' }, status: 'PENDING' },
        ];

        mockPrisma.enrichmentJob.findMany.mockResolvedValueOnce(mockJobs as any);
        mockSubmitEnrichmentBatch.mockResolvedValue(2); // 2 jobs submitted

        const response = await GET(createRequest());
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data.processed).toBe(2);
        expect(json.data.succeeded).toBe(2);
        expect(mockSubmitEnrichmentBatch).toHaveBeenCalledWith(mockJobs);
    });

    it('should handle job processing failures', async () => {
        const mockJobs = [
            { id: 'job-1', workspaceId: 'ws-1', prospect: { id: 'p-1' }, status: 'IN_PROGRESS' },
        ];

        mockPrisma.enrichmentJob.findMany.mockResolvedValueOnce(mockJobs as any);
        mockProcessEnrichmentJob.mockResolvedValueOnce({
            success: false,
            prospectId: 'p-1',
            status: 'NEEDS_REVIEW',
            error: 'API error',
        });

        const response = await GET(createRequest());
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.processed).toBe(1);
        expect(json.data.failed).toBe(1);
        expect(json.data.succeeded).toBe(0);
    });

    it('should respect rate limits per workspace', async () => {
        const mockJobs = [
            { id: 'job-1', workspaceId: 'ws-1', prospect: { id: 'p-1' }, status: 'PENDING' }, // WS-1
            { id: 'job-2', workspaceId: 'ws-2', prospect: { id: 'p-2' }, status: 'PENDING' }, // WS-2
        ];

        mockPrisma.enrichmentJob.findMany.mockResolvedValueOnce(mockJobs as any);

        // Allow ws-1, block ws-2
        mockCanMakeRequest.mockImplementation((wsId) => wsId === 'ws-1');

        mockSubmitEnrichmentBatch.mockResolvedValue(1); // 1 job submitted for ws-1

        const response = await GET(createRequest());
        const json = await response.json();

        expect(json.data.processed).toBe(1);
        expect(json.data.skipped).toBe(1);
    });

    it('should handle failed jobs ready for retry', async () => {
        const mockJobs = [
            {
                id: 'job-1',
                workspaceId: 'ws-1',
                prospect: { id: 'p-1' },
                status: 'FAILED',
                nextRetryAt: new Date(Date.now() - 1000), // Past date
            },
        ];

        mockPrisma.enrichmentJob.findMany.mockResolvedValueOnce(mockJobs as any);
        mockProcessEnrichmentJob.mockResolvedValueOnce({ success: true, prospectId: 'p-1', status: 'VERIFIED' });

        const response = await GET(createRequest());
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.processed).toBe(1);
    });

    it('should return empty results when no jobs found', async () => {
        mockPrisma.enrichmentJob.findMany.mockResolvedValueOnce([]);

        const response = await GET(createRequest());
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.processed).toBe(0);
        expect(json.data.succeeded).toBe(0);
        expect(json.data.failed).toBe(0);
    });

    it('should query jobs with correct filters', async () => {
        mockPrisma.enrichmentJob.findMany.mockResolvedValueOnce([]);

        await GET(createRequest());

        expect(mockPrisma.enrichmentJob.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    OR: expect.arrayContaining([
                        { status: 'PENDING' },
                        { status: 'IN_PROGRESS' },
                    ]),
                }),
                take: 50,
                include: { prospect: true },
            })
        );
    });
});
