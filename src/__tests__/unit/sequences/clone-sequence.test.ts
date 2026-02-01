
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cloneSequence } from '@/lib/sequences/clone-sequence';
import { prisma } from '@/lib/prisma/client';

// Mock Prisma
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        $transaction: vi.fn((callback) => callback(prisma)),
        sequence: {
            findUnique: vi.fn(),
            create: vi.fn(),
            findFirst: vi.fn(),
        },
        sequenceStep: {
            create: vi.fn(),
        },
    },
}));

describe('cloneSequence', () => {
    const mockDate = new Date('2026-01-29T12:00:00Z');
    const workspaceId = 'ws-test-123';
    const originalSequenceId = 'seq-original-123';

    // Sample original sequence
    const mockOriginalSequence = {
        id: originalSequenceId,
        workspaceId,
        name: 'Original Sequence',
        description: 'Original Description',
        isTemplate: false,
        sourceTemplateId: null,
        status: 'READY',
        createdAt: mockDate,
        updatedAt: mockDate,
        steps: [
            {
                id: 'step-1',
                sequenceId: originalSequenceId,
                order: 1,
                subject: 'Subject 1',
                body: 'Body 1',
                delayDays: 0,
                createdAt: mockDate,
                updatedAt: mockDate,
            },
            {
                id: 'step-2',
                sequenceId: originalSequenceId,
                order: 2,
                subject: 'Subject 2',
                body: 'Body 2',
                delayDays: 2,
                createdAt: mockDate,
                updatedAt: mockDate,
            },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should deeply clone a sequence and its steps', async () => {
        // Setup mocks
        vi.mocked(prisma.sequence.findUnique).mockResolvedValue(mockOriginalSequence as any);

        vi.mocked(prisma.sequence.create).mockResolvedValue({
            ...mockOriginalSequence,
            id: 'seq-new-123',
            name: 'Original Sequence (Copie)',
            status: 'DRAFT',
        } as any);

        vi.mocked(prisma.sequenceStep.create).mockImplementation((args) => {
            // Return a mock step based on input
            return Promise.resolve({
                id: `new-step-${args.data.order}`,
                ...args.data,
            } as any);
        });

        // Execute
        const result = await cloneSequence(originalSequenceId, workspaceId);

        // Verify Sequence Clone
        expect(prisma.sequence.findUnique).toHaveBeenCalledWith({
            where: { id: originalSequenceId },
            include: { steps: { orderBy: { order: 'asc' } } },
        });

        expect(prisma.sequence.create).toHaveBeenCalledWith({
            data: {
                workspaceId,
                name: 'Original Sequence (Copie)',
                description: null,
                isTemplate: false,
                sourceTemplateId: null,
                status: 'DRAFT',
            },
        });

        // Verify Steps Clone
        expect(prisma.sequenceStep.create).toHaveBeenCalledTimes(2);
        expect(prisma.sequenceStep.create).toHaveBeenCalledWith({
            data: {
                sequenceId: 'seq-new-123',
                order: 1,
                subject: 'Subject 1',
                body: 'Body 1',
                delayDays: 0,
            },
        });
        expect(prisma.sequenceStep.create).toHaveBeenCalledWith({
            data: {
                sequenceId: 'seq-new-123',
                order: 2,
                subject: 'Subject 2',
                body: 'Body 2',
                delayDays: 2,
            },
        });

        // Verify Result
        expect(result.id).toBe('seq-new-123');
        expect(result.steps).toHaveLength(2);
        expect(result.name).toBe('Original Sequence (Copie)');
    });

    it('should allow overriding name, description and isTemplate options', async () => {
        // Setup mocks
        vi.mocked(prisma.sequence.findUnique).mockResolvedValue(mockOriginalSequence as any);
        vi.mocked(prisma.sequence.create).mockResolvedValue({
            id: 'template-new-123',
            status: 'DRAFT'
        } as any);

        // Execute
        await cloneSequence(originalSequenceId, workspaceId, {
            newName: 'My New Template',
            description: 'Template Description',
            isTemplate: true,
        });

        // Verify
        expect(prisma.sequence.create).toHaveBeenCalledWith({
            data: {
                workspaceId,
                name: 'My New Template',
                description: 'Template Description',
                isTemplate: true,
                sourceTemplateId: null,
                status: 'DRAFT',
            },
        });
    });

    it('should track source template if requested', async () => {
        // Setup mocks
        vi.mocked(prisma.sequence.findUnique).mockResolvedValue(mockOriginalSequence as any);
        vi.mocked(prisma.sequence.create).mockResolvedValue({ id: 'seq-new-123' } as any);

        // Execute
        await cloneSequence(originalSequenceId, workspaceId, {
            trackSourceTemplate: true,
        });

        // Verify
        expect(prisma.sequence.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                sourceTemplateId: originalSequenceId,
            }),
        }));
    });

    it('should throw error if sequence not found', async () => {
        vi.mocked(prisma.sequence.findUnique).mockResolvedValue(null);

        await expect(cloneSequence('missing-id', workspaceId))
            .rejects.toThrow('Sequence not found');
    });

    it('should throw error if access denied (wrong workspace)', async () => {
        vi.mocked(prisma.sequence.findUnique).mockResolvedValue({
            ...mockOriginalSequence,
            workspaceId: 'other-workspace-id',
        } as any);

        await expect(cloneSequence(originalSequenceId, workspaceId))
            .rejects.toThrow('Sequence does not belong to this workspace');
    });
});
