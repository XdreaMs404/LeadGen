/**
 * Unit Tests for Sequences API
 * Story 4.1: Sequence Creation (Max 3 Steps)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
        sequence: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        sequenceStep: {
            count: vi.fn(),
            create: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            updateMany: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

import { prisma } from '@/lib/prisma/client';
import { GET, POST } from '@/app/api/sequences/route';
import { GET as GETById, PUT, DELETE, PATCH } from '@/app/api/sequences/[id]/route';
import { POST as POSTStep } from '@/app/api/sequences/[id]/steps/route';

describe('Sequences API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/sequences', () => {
        it('should return list of sequences with step counts', async () => {
            const mockSequences = [
                {
                    id: 'seq-1',
                    workspaceId: 'test-workspace-id',
                    name: 'Test Sequence 1',
                    status: 'DRAFT',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    _count: { steps: 2 },
                },
                {
                    id: 'seq-2',
                    workspaceId: 'test-workspace-id',
                    name: 'Test Sequence 2',
                    status: 'READY',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    _count: { steps: 3 },
                },
            ];

            vi.mocked(prisma.sequence.findMany).mockResolvedValue(mockSequences as any);

            const response = await GET();
            const json = await response.json();

            expect(json.success).toBe(true);
            expect(json.data.sequences).toHaveLength(2);
            expect(json.data.sequences[0].stepsCount).toBe(2);
            expect(json.data.sequences[1].stepsCount).toBe(3);
        });
    });

    describe('POST /api/sequences', () => {
        it('should create a new sequence with DRAFT status', async () => {
            const mockSequence = {
                id: 'new-seq-id',
                workspaceId: 'test-workspace-id',
                name: 'New Sequence',
                status: 'DRAFT',
                createdAt: new Date(),
                updatedAt: new Date(),
                steps: [],
            };

            vi.mocked(prisma.sequence.create).mockResolvedValue(mockSequence as any);

            const request = new NextRequest('http://localhost/api/sequences', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Sequence' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await POST(request);
            const json = await response.json();

            expect(response.status).toBe(201);
            expect(json.success).toBe(true);
            expect(json.data.name).toBe('New Sequence');
            expect(json.data.status).toBe('DRAFT');
        });

        it('should return 400 for empty name', async () => {
            const request = new NextRequest('http://localhost/api/sequences', {
                method: 'POST',
                body: JSON.stringify({ name: '' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await POST(request);
            const json = await response.json();

            expect(response.status).toBe(400);
            expect(json.success).toBe(false);
            expect(json.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET /api/sequences/[id]', () => {
        it('should return sequence with steps', async () => {
            const mockSequence = {
                id: 'seq-1',
                workspaceId: 'test-workspace-id',
                name: 'Test Sequence',
                status: 'DRAFT',
                createdAt: new Date(),
                updatedAt: new Date(),
                steps: [
                    { id: 'step-1', sequenceId: 'seq-1', order: 1, subject: 'Subject 1', body: 'Body 1', delayDays: 0, createdAt: new Date(), updatedAt: new Date() },
                    { id: 'step-2', sequenceId: 'seq-1', order: 2, subject: 'Subject 2', body: 'Body 2', delayDays: 3, createdAt: new Date(), updatedAt: new Date() },
                ],
            };

            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(mockSequence as any);

            const request = new NextRequest('http://localhost/api/sequences/seq-1');
            const response = await GETById(request, { params: Promise.resolve({ id: 'seq-1' }) });
            const json = await response.json();

            expect(json.success).toBe(true);
            expect(json.data.steps).toHaveLength(2);
            expect(json.data.steps[0].order).toBe(1);
        });

        it('should return 404 for non-existent sequence', async () => {
            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/sequences/non-existent');
            const response = await GETById(request, { params: Promise.resolve({ id: 'non-existent' }) });
            const json = await response.json();

            expect(response.status).toBe(404);
            expect(json.success).toBe(false);
            expect(json.error.code).toBe('NOT_FOUND');
        });
    });

    describe('POST /api/sequences/[id]/steps - Max 3 Steps Validation (AC2)', () => {
        it('should create step when under 3 steps', async () => {
            const mockSequence = { id: 'seq-1', workspaceId: 'test-workspace-id' };
            const mockStep = {
                id: 'new-step',
                sequenceId: 'seq-1',
                order: 2,
                subject: 'Test Subject',
                body: 'Test Body',
                delayDays: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(mockSequence as any);
            vi.mocked(prisma.sequenceStep.count).mockResolvedValue(1);
            vi.mocked(prisma.sequenceStep.create).mockResolvedValue(mockStep as any);

            const request = new NextRequest('http://localhost/api/sequences/seq-1/steps', {
                method: 'POST',
                body: JSON.stringify({ subject: 'Test Subject', body: 'Test Body' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await POSTStep(request, { params: Promise.resolve({ id: 'seq-1' }) });
            const json = await response.json();

            expect(response.status).toBe(201);
            expect(json.success).toBe(true);
            expect(json.data.order).toBe(2);
        });

        it('should return 400 when max 3 steps reached', async () => {
            const mockSequence = { id: 'seq-1', workspaceId: 'test-workspace-id' };

            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(mockSequence as any);
            vi.mocked(prisma.sequenceStep.count).mockResolvedValue(3); // Already at max

            const request = new NextRequest('http://localhost/api/sequences/seq-1/steps', {
                method: 'POST',
                body: JSON.stringify({ subject: 'Test Subject', body: 'Test Body' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await POSTStep(request, { params: Promise.resolve({ id: 'seq-1' }) });
            const json = await response.json();

            expect(response.status).toBe(400);
            expect(json.success).toBe(false);
            expect(json.error.code).toBe('MAX_STEPS_REACHED');
            expect(json.error.message).toBe('Maximum 3 étapes par séquence');
        });
    });

    describe('PUT /api/sequences/[id]', () => {
        it('should update sequence name', async () => {
            const mockSequence = {
                id: 'seq-1',
                workspaceId: 'test-workspace-id',
                name: 'Original Name',
                status: 'DRAFT',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const updatedSequence = {
                ...mockSequence,
                name: 'Updated Name',
                steps: [],
            };

            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(mockSequence as any);
            vi.mocked(prisma.sequence.update).mockResolvedValue(updatedSequence as any);

            const request = new NextRequest('http://localhost/api/sequences/seq-1', {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated Name' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await PUT(request, { params: Promise.resolve({ id: 'seq-1' }) });
            const json = await response.json();

            expect(json.success).toBe(true);
            expect(json.data.name).toBe('Updated Name');
        });

        it('should update sequence status', async () => {
            const mockSequence = {
                id: 'seq-1',
                workspaceId: 'test-workspace-id',
                name: 'Test',
                status: 'DRAFT',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const updatedSequence = {
                ...mockSequence,
                status: 'READY',
                steps: [],
            };

            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(mockSequence as any);
            vi.mocked(prisma.sequence.update).mockResolvedValue(updatedSequence as any);

            const request = new NextRequest('http://localhost/api/sequences/seq-1', {
                method: 'PUT',
                body: JSON.stringify({ status: 'READY' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await PUT(request, { params: Promise.resolve({ id: 'seq-1' }) });
            const json = await response.json();

            expect(json.success).toBe(true);
            expect(json.data.status).toBe('READY');
        });
    });

    describe('DELETE /api/sequences/[id]', () => {
        it('should delete sequence and cascade to steps', async () => {
            const mockSequence = { id: 'seq-1', workspaceId: 'test-workspace-id' };

            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(mockSequence as any);
            vi.mocked(prisma.sequence.delete).mockResolvedValue(mockSequence as any);

            const request = new NextRequest('http://localhost/api/sequences/seq-1', {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: Promise.resolve({ id: 'seq-1' }) });
            const json = await response.json();

            expect(json.success).toBe(true);
            expect(json.data.deleted).toBe(true);
            expect(prisma.sequence.delete).toHaveBeenCalledWith({ where: { id: 'seq-1' } });
        });
    });

    // Story 4.5: Copilot Email Preview (Mandatory) - AC4
    describe('PATCH /api/sequences/[id] - Approve Sequence (Story 4.5)', () => {
        it('should approve sequence with steps and set status to READY', async () => {
            const mockSequence = {
                id: 'seq-1',
                workspaceId: 'test-workspace-id',
                name: 'Test Sequence',
                status: 'DRAFT',
                createdAt: new Date(),
                updatedAt: new Date(),
                _count: { steps: 2 }, // Has steps
            };

            const updatedSequence = {
                ...mockSequence,
                status: 'READY',
                steps: [
                    { id: 'step-1', sequenceId: 'seq-1', order: 1, subject: 'Subject 1', body: 'Body 1', delayDays: 0, createdAt: new Date(), updatedAt: new Date() },
                    { id: 'step-2', sequenceId: 'seq-1', order: 2, subject: 'Subject 2', body: 'Body 2', delayDays: 3, createdAt: new Date(), updatedAt: new Date() },
                ],
            };

            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(mockSequence as any);
            vi.mocked(prisma.sequence.update).mockResolvedValue(updatedSequence as any);

            const request = new NextRequest('http://localhost/api/sequences/seq-1', {
                method: 'PATCH',
                body: JSON.stringify({ status: 'READY' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await PATCH(request, { params: Promise.resolve({ id: 'seq-1' }) });
            const json = await response.json();

            expect(json.success).toBe(true);
            expect(json.data.status).toBe('READY');
        });

        it('should return 400 when approving sequence without steps', async () => {
            const mockSequence = {
                id: 'seq-1',
                workspaceId: 'test-workspace-id',
                name: 'Empty Sequence',
                status: 'DRAFT',
                createdAt: new Date(),
                updatedAt: new Date(),
                _count: { steps: 0 }, // No steps
            };

            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(mockSequence as any);

            const request = new NextRequest('http://localhost/api/sequences/seq-1', {
                method: 'PATCH',
                body: JSON.stringify({ status: 'READY' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await PATCH(request, { params: Promise.resolve({ id: 'seq-1' }) });
            const json = await response.json();

            expect(response.status).toBe(400);
            expect(json.success).toBe(false);
            expect(json.error.code).toBe('VALIDATION_ERROR');
            expect(json.error.message).toBe('Impossible d\'approuver une séquence sans étapes');
        });

        it('should return 404 for non-existent sequence', async () => {
            vi.mocked(prisma.sequence.findFirst).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/sequences/non-existent', {
                method: 'PATCH',
                body: JSON.stringify({ status: 'READY' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await PATCH(request, { params: Promise.resolve({ id: 'non-existent' }) });
            const json = await response.json();

            expect(response.status).toBe(404);
            expect(json.success).toBe(false);
            expect(json.error.code).toBe('NOT_FOUND');
        });
    });
});

