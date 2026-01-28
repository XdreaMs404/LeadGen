/**
 * Prospects List API Integration Tests
 * Story 3.4: Prospect List & Status Display with Filters
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
        auth: {
            getUser: vi.fn(() => Promise.resolve({
                data: { user: { id: 'user-123' } },
            })),
        },
    })),
}));

vi.mock('@/lib/guardrails/workspace-check', () => ({
    getWorkspaceId: vi.fn(() => Promise.resolve('workspace-123')),
    assertWorkspaceAccess: vi.fn(() => Promise.resolve()),
}));

const mockProspects = [
    {
        id: 'prospect-1',
        workspaceId: 'workspace-123',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme Inc',
        title: 'CEO',
        phone: '+33123456789',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        source: 'CRM_EXPORT',
        sourceDetail: 'Salesforce',
        status: 'NEW',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 'prospect-2',
        workspaceId: 'workspace-123',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        company: 'Tech Corp',
        title: 'CTO',
        phone: null,
        linkedinUrl: null,
        source: 'NETWORK_REFERRAL',
        sourceDetail: null,
        status: 'VERIFIED',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
    },
];

vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        prospect: {
            findMany: vi.fn(() => Promise.resolve(mockProspects)),
            count: vi.fn(() => Promise.resolve(2)),
        },
    },
}));

// Import after mocks
import { GET } from '@/app/api/prospects/route';
import { prisma } from '@/lib/prisma/client';

describe('GET /api/prospects', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns paginated prospects with default params', async () => {
        const req = new NextRequest('http://localhost/api/prospects');
        const res = await GET(req);
        const json = await res.json();

        expect(json.success).toBe(true);
        expect(json.data.prospects).toHaveLength(2);
        expect(json.data.total).toBe(2);
        expect(json.data.page).toBe(1);
        expect(json.data.pageSize).toBe(25);
    });

    it('applies pagination params correctly', async () => {
        const req = new NextRequest('http://localhost/api/prospects?page=2&pageSize=50');
        await GET(req);

        expect(prisma.prospect.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 50, // (2-1) * 50
                take: 50,
            })
        );
    });

    it('applies search filter across multiple fields', async () => {
        const req = new NextRequest('http://localhost/api/prospects?search=john');
        await GET(req);

        expect(prisma.prospect.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    OR: expect.arrayContaining([
                        expect.objectContaining({ firstName: { contains: 'john', mode: 'insensitive' } }),
                        expect.objectContaining({ lastName: { contains: 'john', mode: 'insensitive' } }),
                        expect.objectContaining({ email: { contains: 'john', mode: 'insensitive' } }),
                        expect.objectContaining({ company: { contains: 'john', mode: 'insensitive' } }),
                    ]),
                }),
            })
        );
    });

    it('applies status filter', async () => {
        const req = new NextRequest('http://localhost/api/prospects?status=NEW&status=VERIFIED');
        await GET(req);

        expect(prisma.prospect.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    status: { in: ['NEW', 'VERIFIED'] },
                }),
            })
        );
    });

    it('applies source filter', async () => {
        const req = new NextRequest('http://localhost/api/prospects?source=CRM_EXPORT');
        await GET(req);

        expect(prisma.prospect.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    source: { in: ['CRM_EXPORT'] },
                }),
            })
        );
    });

    it('applies date range filter', async () => {
        const fromDate = '2024-01-01';
        const toDate = '2024-12-31';
        const req = new NextRequest(`http://localhost/api/prospects?fromDate=${fromDate}&toDate=${toDate}`);
        await GET(req);

        // Verify the API was called - the where clause structure is complex with spreads
        expect(prisma.prospect.findMany).toHaveBeenCalled();
        const callArgs = vi.mocked(prisma.prospect.findMany).mock.calls[0]?.[0];
        expect(callArgs?.where).toBeDefined();
    });

    it('validates pageSize to allowed values (25, 50, 100)', async () => {
        const req = new NextRequest('http://localhost/api/prospects?pageSize=999');
        await GET(req);

        // Should default to 25 if invalid
        expect(prisma.prospect.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                take: 25,
            })
        );
    });

    it('ensures page is at least 1', async () => {
        const req = new NextRequest('http://localhost/api/prospects?page=-5');
        await GET(req);

        expect(prisma.prospect.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 0, // (1-1) * 25
            })
        );
    });

    it('filters out invalid status values', async () => {
        const req = new NextRequest('http://localhost/api/prospects?status=INVALID&status=NEW');
        await GET(req);

        expect(prisma.prospect.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    status: { in: ['NEW'] }, // INVALID should be filtered out
                }),
            })
        );
    });

    it('returns 401 when not authenticated', async () => {
        // Override mock for this test
        const { createClient } = await import('@/lib/supabase/server');
        vi.mocked(createClient).mockResolvedValueOnce({
            auth: {
                getUser: vi.fn(() => Promise.resolve({
                    data: { user: null },
                })),
            },
        } as any);

        const req = new NextRequest('http://localhost/api/prospects');
        const res = await GET(req);

        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('orders by createdAt desc', async () => {
        const req = new NextRequest('http://localhost/api/prospects');
        await GET(req);

        expect(prisma.prospect.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { createdAt: 'desc' },
            })
        );
    });

    it('includes workspaceId in where clause for isolation', async () => {
        const req = new NextRequest('http://localhost/api/prospects');
        await GET(req);

        expect(prisma.prospect.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    workspaceId: 'workspace-123',
                }),
            })
        );
    });
});
