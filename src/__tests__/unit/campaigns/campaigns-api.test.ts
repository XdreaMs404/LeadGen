/**
 * Unit Tests for Campaigns API
 * Story 5.1: Campaign Entity & Status Model
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id' } },
            }),
        },
    }),
}));

vi.mock('@/lib/guardrails/workspace-check', () => ({
    assertWorkspaceAccess: vi.fn().mockResolvedValue(undefined),
    getWorkspaceId: vi.fn().mockResolvedValue('test-workspace-id'),
}));

vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        campaign: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        sequence: {
            findFirst: vi.fn(),
        },
        scheduledEmail: {
            groupBy: vi.fn(),
        },
        sentEmail: {
            count: vi.fn(),
        },
    },
}));

import { prisma } from '@/lib/prisma/client';
import { GET, POST } from '@/app/api/campaigns/route';
import { GET as GETById, PATCH, DELETE } from '@/app/api/campaigns/[id]/route';

describe('Campaigns API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/campaigns', () => {
        it('should return list of campaigns', async () => {
            const mockCampaigns = [
                {
                    id: 'camp-1',
                    workspaceId: 'test-workspace-id',
                    name: 'Test Campaign',
                    status: 'DRAFT',
                    createdAt: new Date(),
                    sequence: { id: 'seq-1', name: 'Seq 1' },
                    _count: { prospects: 10 },
                },
            ];

            vi.mocked(prisma.campaign.findMany).mockResolvedValue(mockCampaigns as any);

            const response = await GET();
            const json = await response.json();

            expect(json.success).toBe(true);
            expect(json.data.campaigns).toHaveLength(1);
            expect(json.data.campaigns[0].name).toBe('Test Campaign');
            expect(json.data.campaigns[0].enrollmentCounts?.total).toBe(10);
        });
    });

    describe('POST /api/campaigns', () => {
        it('should create a new campaign if sequence is READY', async () => {
            const mockSequence = {
                id: 'seq-1',
                workspaceId: 'test-workspace-id',
                status: 'READY', // Valid status
            };

            const mockCampaign = {
                id: 'new-camp',
                name: 'New Campaign',
                status: 'DRAFT',
                sequenceId: 'seq-1',
                createdAt: new Date(),
                sequence: { id: 'seq-1', name: 'Seq 1' },
            };

            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(mockSequence as any);
            vi.mocked(prisma.campaign.create).mockResolvedValue(mockCampaign as any);

            const request = new NextRequest('http://localhost/api/campaigns', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Campaign', sequenceId: 'seq-1' }),
            });

            const response = await POST(request);
            const json = await response.json();

            expect(response.status).toBe(201);
            expect(json.success).toBe(true);
            expect(json.data.name).toBe('New Campaign');
        });

        it('should error if sequence not found', async () => {
            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/campaigns', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Campaign', sequenceId: 'seq-1' }),
            });

            const response = await POST(request);
            const json = await response.json();

            expect(response.status).toBe(404);
            expect(json.error.code).toBe('NOT_FOUND');
        });

        it('should error if sequence is DRAFT (not READY)', async () => {
            const mockSequence = {
                id: 'seq-1',
                workspaceId: 'test-workspace-id',
                status: 'DRAFT', // Invalid status
            };

            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(mockSequence as any);

            const request = new NextRequest('http://localhost/api/campaigns', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Campaign', sequenceId: 'seq-1' }),
            });

            const response = await POST(request);
            const json = await response.json();

            expect(response.status).toBe(400);
            expect(json.error.code).toBe('VALIDATION_ERROR');
            expect(json.error.message).toBe('La séquence doit être prête (status: READY)');
        });
    });

    describe('GET /api/campaigns/[id]', () => {
        it('should return campaign details', async () => {
            const mockCampaign = {
                id: 'camp-1',
                workspaceId: 'test-workspace-id',
                name: 'Test Campaign',
                status: 'DRAFT',
                createdAt: new Date(),
                sequence: { id: 'seq-1', name: 'Seq 1' },
                prospects: [],
            };

            vi.mocked(prisma.campaign.findFirst).mockResolvedValue(mockCampaign as any);
            vi.mocked(prisma.scheduledEmail.groupBy).mockResolvedValue([] as any);
            vi.mocked(prisma.sentEmail.count).mockResolvedValue(0);

            const request = new NextRequest('http://localhost/api/campaigns/camp-1');
            const response = await GETById(request, { params: Promise.resolve({ id: 'camp-1' }) });
            const json = await response.json();

            expect(json.success).toBe(true);
            expect(json.data.id).toBe('camp-1');
        });

        it('should return 404 if not found', async () => {
            vi.mocked(prisma.campaign.findFirst).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/campaigns/unknown');
            const response = await GETById(request, { params: Promise.resolve({ id: 'unknown' }) });
            const json = await response.json();

            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /api/campaigns/[id]', () => {
        it('should update campaign name', async () => {
            const mockCampaign = {
                id: 'camp-1',
                workspaceId: 'test-workspace-id',
                name: 'Old Name',
                status: 'DRAFT',
                createdAt: new Date(),
                sequenceId: 'seq-1',
                sequence: { id: 'seq-1', name: 'Seq 1' },
            };
            const updatedCampaign = { ...mockCampaign, name: 'Updated Name' };

            vi.mocked(prisma.campaign.findFirst).mockResolvedValue(mockCampaign as any);
            vi.mocked(prisma.campaign.update).mockResolvedValue(updatedCampaign as any);

            const request = new NextRequest('http://localhost/api/campaigns/camp-1', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'Updated Name' }),
            });

            const response = await PATCH(request, { params: Promise.resolve({ id: 'camp-1' }) });
            const json = await response.json();

            expect(json.success).toBe(true);
            expect(json.data.name).toBe('Updated Name');
        });
    });

    describe('DELETE /api/campaigns/[id]', () => {
        it('should delete DRAFT campaign', async () => {
            const mockCampaign = {
                id: 'camp-1',
                workspaceId: 'test-workspace-id',
                status: 'DRAFT',
            };

            vi.mocked(prisma.campaign.findFirst).mockResolvedValue(mockCampaign as any);

            const request = new NextRequest('http://localhost/api/campaigns/camp-1', {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: Promise.resolve({ id: 'camp-1' }) });
            const json = await response.json();

            expect(json.success).toBe(true);
            expect(json.data.deleted).toBe(true);
        });

        it('should not delete RUNNING campaign', async () => {
            const mockCampaign = {
                id: 'camp-1',
                workspaceId: 'test-workspace-id',
                status: 'RUNNING',
            };

            vi.mocked(prisma.campaign.findFirst).mockResolvedValue(mockCampaign as any);

            const request = new NextRequest('http://localhost/api/campaigns/camp-1', {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: Promise.resolve({ id: 'camp-1' }) });
            const json = await response.json();

            expect(response.status).toBe(403);
            expect(json.error.code).toBe('FORBIDDEN');
        });
    });
});
