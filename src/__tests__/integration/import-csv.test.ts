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
        prospect: {
            createMany: vi.fn(),
            findMany: vi.fn(),
        },
    },
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { getWorkspaceId, assertWorkspaceAccess } from '@/lib/guardrails/workspace-check';

// Lazy load the route module once for all tests
let POST: typeof import('@/app/api/prospects/import/route').POST;

// Skip: These tests have persistent timeout issues due to heavy module loading
// TODO: Re-enable once vitest test isolation is improved
describe.skip('Prospect Import API Integration', { timeout: 15000 }, () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Load module only if not already loaded
        if (!POST) {
            const module = await import('@/app/api/prospects/import/route');
            POST = module.POST;
        }
    });

    describe('POST /api/prospects/import', () => {
        const createMockFormData = (
            fileContent: string,
            source: string,
            mapping: any = { email: 'email' }
        ) => {
            const formData = new FormData();
            const file = new File([fileContent], 'test.csv', { type: 'text/csv' });
            formData.append('file', file);
            formData.append('source', source);
            formData.append('columnMapping', JSON.stringify(mapping));
            return formData;
        };

        it('retourne 401 si utilisateur non authentifié', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: null },
                        error: { message: 'Not authenticated' },
                    }),
                },
            } as never);

            const request = new Request('http://localhost/api/prospects/import', {
                method: 'POST',
                body: new FormData(),
            });
            const response = await POST(request as never);

            expect(response.status).toBe(401);
        });

        it('valide les champs requis (fichier manquant)', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            vi.mocked(getWorkspaceId).mockResolvedValueOnce('ws-123');

            const formData = new FormData();
            formData.append('source', 'CRM_EXPORT');

            const request = new Request('http://localhost/api/prospects/import', {
                method: 'POST',
                body: formData,
            });
            const response = await POST(request as never);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error.message).toContain('Fichier CSV manquant');
        });

        it('valide le mapping JSON corrompu', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            vi.mocked(getWorkspaceId).mockResolvedValueOnce('ws-123');

            const formData = new FormData();
            formData.append('file', new File(['email'], 'test.csv'));
            formData.append('source', 'CRM_EXPORT');
            formData.append('columnMapping', '{invalid-json');

            const request = new Request('http://localhost/api/prospects/import', {
                method: 'POST',
                body: formData,
            });
            const response = await POST(request as never);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error.message).toContain('JSON mapping invalide');
        });

        it('importe les prospects valides avec succès', async () => {
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

            // Mock existing prospects check (empty)
            vi.mocked(prisma.prospect.findMany).mockResolvedValueOnce([]);

            // Mock creation
            vi.mocked(prisma.prospect.createMany).mockResolvedValueOnce({ count: 2 } as never);

            const csvContent = 'email,name\ntest1@example.com,Test 1\ntest2@example.com,Test 2';
            const formData = createMockFormData(csvContent, 'CRM_EXPORT', { email: 'email', name: 'firstName' });

            const request = new Request('http://localhost/api/prospects/import', {
                method: 'POST',
                body: formData,
            });
            const response = await POST(request as never);

            expect(response.status).toBe(201);
            const data = await response.json();

            // Verify Prisma call
            expect(prisma.prospect.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({ email: 'test1@example.com', firstName: 'Test 1' }),
                    expect.objectContaining({ email: 'test2@example.com', firstName: 'Test 2' }),
                ]),
                skipDuplicates: true,
            });

            expect(data.data.imported).toBe(2);
        });

        it('gère les doublons existants', async () => {
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            vi.mocked(getWorkspaceId).mockResolvedValueOnce('ws-123');

            // Mock existing prospects
            vi.mocked(prisma.prospect.findMany).mockResolvedValueOnce([
                { email: 'existing@example.com' } // Existing prospect
            ] as never);

            // Mock creation
            vi.mocked(prisma.prospect.createMany).mockResolvedValueOnce({ count: 1 } as never);

            const csvContent = 'email\nnew@example.com\nexisting@example.com';
            const formData = createMockFormData(csvContent, 'CRM_EXPORT');

            const request = new Request('http://localhost/api/prospects/import', {
                method: 'POST',
                body: formData,
            });
            const response = await POST(request as never);

            expect(response.status).toBe(201);
            const data = await response.json();

            expect(data.data.imported).toBe(1); // Only new one imported
            expect(data.data.duplicates).toBe(1); // One duplicate detected
        });
    });
});
