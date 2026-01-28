import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        workspace: {
            findFirst: vi.fn(),
        },
    },
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { GET } from '@/app/api/workspace/onboarding-status/route';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;
const mockPrismaWorkspace = prisma.workspace as {
    findFirst: ReturnType<typeof vi.fn>;
};

describe('GET /api/workspace/onboarding-status', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 when user is not authenticated', async () => {
        mockCreateClient.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            },
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('unauthorized');
    });

    it('returns 404 when workspace is not found', async () => {
        mockCreateClient.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { id: 'user-123' } },
                }),
            },
        });
        mockPrismaWorkspace.findFirst.mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('not_found');
    });

    it('returns correct onboarding status when incomplete', async () => {
        mockCreateClient.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { id: 'user-123' } },
                }),
            },
        });
        mockPrismaWorkspace.findFirst.mockResolvedValue({
            id: 'ws-123',
            gmailToken: null,
            spfStatus: 'NOT_STARTED',
            dkimStatus: 'NOT_STARTED',
            dmarcStatus: 'NOT_STARTED',
            onboardingComplete: false,
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual({
            gmailConnected: false,
            gmailEmail: null,
            spfStatus: 'NOT_STARTED',
            dkimStatus: 'NOT_STARTED',
            dmarcStatus: 'NOT_STARTED',
            onboardingComplete: false,
            progressPercent: 0,
        });
    });

    it('returns correct onboarding status when complete', async () => {
        mockCreateClient.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { id: 'user-123' } },
                }),
            },
        });
        mockPrismaWorkspace.findFirst.mockResolvedValue({
            id: 'ws-123',
            gmailToken: { id: 'token-123', email: 'test@example.com' },
            spfStatus: 'PASS',
            dkimStatus: 'PASS',
            dmarcStatus: 'PASS',
            onboardingComplete: true,
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual({
            gmailConnected: true,
            gmailEmail: 'test@example.com',
            spfStatus: 'PASS',
            dkimStatus: 'PASS',
            dmarcStatus: 'PASS',
            onboardingComplete: true,
            progressPercent: 100,
        });
    });

    it('calculates progress correctly at 50%', async () => {
        mockCreateClient.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { id: 'user-123' } },
                }),
            },
        });
        mockPrismaWorkspace.findFirst.mockResolvedValue({
            id: 'ws-123',
            gmailToken: { id: 'token-123', email: 'test@example.com' },
            spfStatus: 'PASS',
            dkimStatus: 'NOT_STARTED',
            dmarcStatus: 'NOT_STARTED',
            onboardingComplete: false,
        });

        const response = await GET();
        const data = await response.json();

        expect(data.data.progressPercent).toBe(50);
        expect(data.data.onboardingComplete).toBe(false);
    });

    it('treats MANUAL_OVERRIDE as complete', async () => {
        mockCreateClient.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { id: 'user-123' } },
                }),
            },
        });
        mockPrismaWorkspace.findFirst.mockResolvedValue({
            id: 'ws-123',
            gmailToken: { id: 'token-123', email: 'test@example.com' },
            spfStatus: 'MANUAL_OVERRIDE',
            dkimStatus: 'MANUAL_OVERRIDE',
            dmarcStatus: 'MANUAL_OVERRIDE',
            onboardingComplete: true,
        });

        const response = await GET();
        const data = await response.json();

        expect(data.data.progressPercent).toBe(100);
        expect(data.data.onboardingComplete).toBe(true);
    });
});
