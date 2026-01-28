import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT } from '@/app/api/sequences/[id]/steps/[stepId]/route';
import { prisma } from '@/lib/prisma/client';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        sequenceStep: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/guardrails/workspace-check', () => ({
    getWorkspaceId: vi.fn().mockResolvedValue('workspace-123'),
    assertWorkspaceAccess: vi.fn().mockResolvedValue(true),
}));

describe('Step Update API Integrity (Story 4.2)', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock Auth
        (createClient as any).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
            },
        });
    });

    it('should enforce delayDays=0 when updating the first step (AC6)', async () => {
        // Setup: Step 1 exists
        (prisma.sequenceStep.findFirst as any).mockResolvedValue({
            id: 'step-1',
            sequenceId: 'seq-1',
            order: 1, // It is the first step
            delayDays: 0,
        });

        // Mock update result
        (prisma.sequenceStep.update as any).mockResolvedValue({
            id: 'step-1',
            order: 1,
            delayDays: 0,
            subject: 'Updated',
        });

        // Request: Try to set delayDays = 5
        const req = new NextRequest('http://localhost/api/sequences/seq-1/steps/step-1', {
            method: 'PUT',
            body: JSON.stringify({
                delayDays: 5,
            }),
        });

        const params = Promise.resolve({ id: 'seq-1', stepId: 'step-1' });
        await PUT(req, { params });

        // Verification: ensure update was called with delayDays: 0, NOT 5
        expect(prisma.sequenceStep.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'step-1' },
            data: expect.objectContaining({
                delayDays: 0,
            }),
        }));
    });

    it('should allow setting delayDays for non-first steps', async () => {
        // Setup: Step 2 exists
        (prisma.sequenceStep.findFirst as any).mockResolvedValue({
            id: 'step-2',
            sequenceId: 'seq-1',
            order: 2,
            delayDays: 3,
        });

        (prisma.sequenceStep.update as any).mockResolvedValue({
            id: 'step-2',
            order: 2,
            delayDays: 7,
        });

        // Request: Set delayDays = 7
        const req = new NextRequest('http://localhost/api/sequences/seq-1/steps/step-2', {
            method: 'PUT',
            body: JSON.stringify({
                delayDays: 7,
            }),
        });

        const params = Promise.resolve({ id: 'seq-1', stepId: 'step-2' });
        await PUT(req, { params });

        // Verification: ensure update was called with delayDays: 7
        expect(prisma.sequenceStep.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'step-2' },
            data: expect.objectContaining({
                delayDays: 7,
            }),
        }));
    });
});
