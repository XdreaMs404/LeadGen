import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('DNS Status API Integration', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    describe('GET /api/workspace/dns-status', () => {
        it('should return 401 if user is not authenticated', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: null },
                        error: { message: 'Not authenticated' },
                    }),
                },
            } as never);

            const { GET } = await import('@/app/api/workspace/dns-status/route');
            const response = await GET();

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should return 404 if workspace not found', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            vi.mocked(prisma.workspace.findFirst).mockResolvedValueOnce(null);

            const { GET } = await import('@/app/api/workspace/dns-status/route');
            const response = await GET();

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('NOT_FOUND');
        });

        it('should return DNS status with domain extracted from Gmail email', async () => {
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
                spfStatus: 'NOT_STARTED',
                dkimStatus: 'PASS',
                dmarcStatus: 'FAIL',
                dkimSelector: 'google',
                gmailToken: {
                    email: 'user@example.com',
                },
            } as never);

            const { GET } = await import('@/app/api/workspace/dns-status/route');
            const response = await GET();

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data).toEqual({
                spfStatus: 'NOT_STARTED',
                dkimStatus: 'PASS',
                dmarcStatus: 'FAIL',
                dkimSelector: 'google',
                domain: 'example.com',
            });
        });

        it('should return null domain if Gmail not connected', async () => {
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
                spfStatus: 'NOT_STARTED',
                dkimStatus: 'NOT_STARTED',
                dmarcStatus: 'NOT_STARTED',
                dkimSelector: null,
                gmailToken: null,
            } as never);

            const { GET } = await import('@/app/api/workspace/dns-status/route');
            const response = await GET();

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data.domain).toBeNull();
        });

        it('should return workspace-scoped data only', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-456' } },
                        error: null,
                    }),
                },
            } as never);

            vi.mocked(prisma.workspace.findFirst).mockResolvedValueOnce({
                id: 'ws-456',
                spfStatus: 'PASS',
                dkimStatus: 'PASS',
                dmarcStatus: 'PASS',
                dkimSelector: 'custom',
                gmailToken: {
                    email: 'admin@company.fr',
                },
            } as never);

            const { GET } = await import('@/app/api/workspace/dns-status/route');
            const response = await GET();

            expect(response.status).toBe(200);
            const data = await response.json();

            // Verify prisma was called with correct user filter
            expect(prisma.workspace.findFirst).toHaveBeenCalledWith({
                where: { userId: 'user-456' },
                select: expect.objectContaining({
                    spfStatus: true,
                    dkimStatus: true,
                    dmarcStatus: true,
                }),
            });
        });
    });
});
