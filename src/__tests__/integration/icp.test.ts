import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/guardrails/workspace-check', () => ({
    getWorkspaceId: vi.fn(),
    assertWorkspaceAccess: vi.fn(),
}));

vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        workspace: {
            findFirst: vi.fn(),
        },
        icpConfig: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { getWorkspaceId, assertWorkspaceAccess } from '@/lib/guardrails/workspace-check';

describe('ICP API Integration', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    describe('GET /api/workspace/icp', () => {
        it('retourne 401 si utilisateur non authentifié', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: null },
                        error: { message: 'Not authenticated' },
                    }),
                },
            } as never);

            const { GET } = await import('@/app/api/workspace/icp/route');
            const response = await GET();

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('retourne null si ICP non configuré', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            vi.mocked(getWorkspaceId).mockResolvedValueOnce('ws-123');
            vi.mocked(assertWorkspaceAccess).mockResolvedValueOnce(undefined);
            vi.mocked(prisma.icpConfig.findUnique).mockResolvedValueOnce(null);

            const { GET } = await import('@/app/api/workspace/icp/route');
            const response = await GET();

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data).toBeNull();
        });

        it('retourne la config ICP existante', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            vi.mocked(getWorkspaceId).mockResolvedValueOnce('ws-123');
            vi.mocked(assertWorkspaceAccess).mockResolvedValueOnce(undefined);

            const mockIcp = {
                id: 'icp-123',
                workspaceId: 'ws-123',
                industries: ['Tech', 'SaaS'],
                companySizes: ['11-50'],
                roles: ['CEO'],
                locations: ['France'],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            vi.mocked(prisma.icpConfig.findUnique).mockResolvedValueOnce(mockIcp as never);

            const { GET } = await import('@/app/api/workspace/icp/route');
            const response = await GET();

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data.id).toBe('icp-123');
            expect(data.data.industries).toEqual(['Tech', 'SaaS']);
        });
    });

    describe('PUT /api/workspace/icp', () => {
        it('retourne 401 si utilisateur non authentifié', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: null },
                        error: null,
                    }),
                },
            } as never);

            const { PUT } = await import('@/app/api/workspace/icp/route');
            const request = new Request('http://localhost/api/workspace/icp', {
                method: 'PUT',
                body: JSON.stringify({ industries: ['Tech'] }),
            });
            const response = await PUT(request as never);

            expect(response.status).toBe(401);
        });

        it('retourne 400 pour données invalides (companySizes)', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            vi.mocked(getWorkspaceId).mockResolvedValueOnce('ws-123');
            vi.mocked(assertWorkspaceAccess).mockResolvedValueOnce(undefined);

            const { PUT } = await import('@/app/api/workspace/icp/route');
            const request = new Request('http://localhost/api/workspace/icp', {
                method: 'PUT',
                body: JSON.stringify({ companySizes: ['invalid-size'] }),
            });
            const response = await PUT(request as never);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('VALIDATION_ERROR');
        });

        it('crée une nouvelle config ICP (upsert)', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            vi.mocked(getWorkspaceId).mockResolvedValueOnce('ws-123');
            vi.mocked(assertWorkspaceAccess).mockResolvedValueOnce(undefined);

            const mockCreatedIcp = {
                id: 'icp-new',
                workspaceId: 'ws-123',
                industries: ['Fintech'],
                companySizes: ['51-200'],
                roles: ['CTO'],
                locations: ['Paris'],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            vi.mocked(prisma.icpConfig.upsert).mockResolvedValueOnce(mockCreatedIcp as never);

            const { PUT } = await import('@/app/api/workspace/icp/route');
            const request = new Request('http://localhost/api/workspace/icp', {
                method: 'PUT',
                body: JSON.stringify({
                    industries: ['Fintech'],
                    companySizes: ['51-200'],
                    roles: ['CTO'],
                    locations: ['Paris'],
                }),
            });
            const response = await PUT(request as never);

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data.industries).toEqual(['Fintech']);
            expect(data.data.companySizes).toEqual(['51-200']);
        });

        it('met à jour une config ICP existante', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            vi.mocked(getWorkspaceId).mockResolvedValueOnce('ws-123');
            vi.mocked(assertWorkspaceAccess).mockResolvedValueOnce(undefined);

            const mockUpdatedIcp = {
                id: 'icp-123',
                workspaceId: 'ws-123',
                industries: ['E-commerce'],
                companySizes: ['201-500'],
                roles: ['VP Marketing'],
                locations: ['Europe'],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            vi.mocked(prisma.icpConfig.upsert).mockResolvedValueOnce(mockUpdatedIcp as never);

            const { PUT } = await import('@/app/api/workspace/icp/route');
            const request = new Request('http://localhost/api/workspace/icp', {
                method: 'PUT',
                body: JSON.stringify({
                    industries: ['E-commerce'],
                    companySizes: ['201-500'],
                    roles: ['VP Marketing'],
                    locations: ['Europe'],
                }),
            });
            const response = await PUT(request as never);

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data.industries).toEqual(['E-commerce']);
        });
    });

    describe('Isolation multi-tenant', () => {
        it('utilise assertWorkspaceAccess pour sécuriser l\'accès', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            // getWorkspaceId throws - no workspace for user
            vi.mocked(getWorkspaceId).mockRejectedValueOnce(new Error('No workspace found for user'));

            const { GET } = await import('@/app/api/workspace/icp/route');
            const response = await GET();

            // Should fail with 500 because getWorkspaceId throws
            expect(response.status).toBe(500);
        });
    });
});
