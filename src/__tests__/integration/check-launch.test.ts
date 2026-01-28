import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        workspace: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
        },
        gmailToken: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('@/lib/crypto/encrypt', () => ({
    decrypt: vi.fn((text: string) => text.replace('encrypted:', '')),
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';

describe('Campaign Check-Launch API Integration', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    describe('GET /api/campaigns/check-launch', () => {
        it('should return 401 if user is not authenticated', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: null },
                        error: { message: 'Not authenticated' },
                    }),
                },
            } as never);

            const { GET } = await import('@/app/api/campaigns/check-launch/route');
            const response = await GET();

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should return 404 if workspace not found for user', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            // getWorkspaceId calls prisma.workspace.findFirst
            vi.mocked(prisma.workspace.findFirst).mockResolvedValueOnce(null);

            const { GET } = await import('@/app/api/campaigns/check-launch/route');
            const response = await GET();

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('WORKSPACE_NOT_FOUND');
        });

        it('should return canLaunch: false when onboarding is incomplete', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            // getWorkspaceId
            vi.mocked(prisma.workspace.findFirst).mockResolvedValueOnce({
                id: 'ws-123',
            } as never);

            // checkCanSend
            vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
                onboardingComplete: false,
                gmailToken: { id: 'token-123' },
            } as never);

            const { GET } = await import('@/app/api/campaigns/check-launch/route');
            const response = await GET();

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data.canLaunch).toBe(false);
            expect(data.data.blockedReason).toContain('délivrabilité');
        });

        it('should return canLaunch: false when Gmail is not connected', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            // getWorkspaceId
            vi.mocked(prisma.workspace.findFirst).mockResolvedValueOnce({
                id: 'ws-123',
            } as never);

            // checkCanSend - onboarding complete but no Gmail
            vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
                onboardingComplete: true,
                gmailToken: null,
            } as never);

            const { GET } = await import('@/app/api/campaigns/check-launch/route');
            const response = await GET();

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data.canLaunch).toBe(false);
            expect(data.data.blockedReason).toContain('Gmail');
        });

        it('should return canLaunch: true when all conditions are met', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            // getWorkspaceId
            vi.mocked(prisma.workspace.findFirst).mockResolvedValueOnce({
                id: 'ws-123',
            } as never);

            // checkCanSend - all conditions met
            vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
                onboardingComplete: true,
                gmailToken: { id: 'token-123' },
            } as never);

            // isTokenValid calls getValidToken which calls prisma.gmailToken.findUnique
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce({
                id: 'token-123',
                workspaceId: 'ws-123',
                accessToken: 'encrypted:valid-token',
                refreshToken: 'encrypted:refresh-token',
                expiresAt: futureDate,
                email: 'user@example.com',
            } as never);

            const { GET } = await import('@/app/api/campaigns/check-launch/route');
            const response = await GET();

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data.canLaunch).toBe(true);
            expect(data.data.blockedReason).toBeUndefined();
        });

        it('should use ApiResponse format for all responses', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            vi.mocked(prisma.workspace.findFirst).mockResolvedValueOnce({
                id: 'ws-123',
            } as never);

            vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
                onboardingComplete: true,
                gmailToken: { id: 'token-123' },
            } as never);

            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce({
                id: 'token-123',
                workspaceId: 'ws-123',
                accessToken: 'encrypted:valid-token',
                refreshToken: 'encrypted:refresh-token',
                expiresAt: futureDate,
                email: 'user@example.com',
            } as never);

            const { GET } = await import('@/app/api/campaigns/check-launch/route');
            const response = await GET();

            const data = await response.json();

            // Verify ApiResponse structure
            expect(data).toHaveProperty('success');
            expect(typeof data.success).toBe('boolean');

            if (data.success) {
                expect(data).toHaveProperty('data');
                expect(data.data).toHaveProperty('canLaunch');
            } else {
                expect(data).toHaveProperty('error');
                expect(data.error).toHaveProperty('code');
                expect(data.error).toHaveProperty('message');
            }
        });
    });
});
