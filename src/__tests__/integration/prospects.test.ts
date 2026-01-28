/**
 * Tests for Manual Prospect Creation API (Story 3.3)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/prospects/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        prospect: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        workspace: {
            findFirst: vi.fn(),
        },
    },
}));

vi.mock('@/lib/guardrails/workspace-check', () => ({
    getWorkspaceId: vi.fn(),
    assertWorkspaceAccess: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { getWorkspaceId, assertWorkspaceAccess } from '@/lib/guardrails/workspace-check';

const mockCreateClient = vi.mocked(createClient);
const mockPrisma = vi.mocked(prisma);
const mockGetWorkspaceId = vi.mocked(getWorkspaceId);
const mockAssertWorkspaceAccess = vi.mocked(assertWorkspaceAccess);

function createMockRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost:3000/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('POST /api/prospects', () => {
    const mockUser = { id: 'user-123' };
    const mockWorkspaceId = 'workspace-456';

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock setup for authenticated user
        mockCreateClient.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
            },
        } as unknown as Awaited<ReturnType<typeof createClient>>);

        mockGetWorkspaceId.mockResolvedValue(mockWorkspaceId);
        mockAssertWorkspaceAccess.mockResolvedValue(undefined);
        mockPrisma.prospect.findFirst.mockResolvedValue(null); // No duplicates by default
    });

    it('creates prospect successfully with status NEW', async () => {
        const createdProspect = {
            id: 'prospect-789',
            workspaceId: mockWorkspaceId,
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            company: 'Acme',
            title: 'CEO',
            phone: null,
            linkedinUrl: null,
            source: 'OUTBOUND_RESEARCH',
            sourceDetail: null,
            status: 'NEW',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockPrisma.prospect.create.mockResolvedValue(createdProspect);

        const req = createMockRequest({
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            company: 'Acme',
            title: 'CEO',
            source: 'OUTBOUND_RESEARCH',
        });

        const response = await POST(req);
        const json = await response.json();

        expect(response.status).toBe(201);
        expect(json.success).toBe(true);
        expect(json.data.email).toBe('test@example.com');
        expect(json.data.status).toBe('NEW');
    });

    it('returns 400 for invalid email format', async () => {
        const req = createMockRequest({
            email: 'invalid-email',
            source: 'OUTBOUND_RESEARCH',
        });

        const response = await POST(req);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 409 for duplicate email with prospect ID', async () => {
        const existingProspect = {
            id: 'existing-prospect-123',
            workspaceId: mockWorkspaceId,
            email: 'existing@example.com',
        };

        mockPrisma.prospect.findFirst.mockResolvedValue(existingProspect as never);

        const req = createMockRequest({
            email: 'existing@example.com',
            source: 'OUTBOUND_RESEARCH',
        });

        const response = await POST(req);
        const json = await response.json();

        expect(response.status).toBe(409);
        expect(json.success).toBe(false);
        expect(json.error.code).toBe('DUPLICATE_PROSPECT');
        expect(json.error.message).toBe('Ce prospect existe déjà');
        expect(json.error.details).toEqual({ prospectId: 'existing-prospect-123' });
    });

    it('returns 401 without authentication', async () => {
        mockCreateClient.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            },
        } as unknown as Awaited<ReturnType<typeof createClient>>);

        const req = createMockRequest({
            email: 'test@example.com',
            source: 'OUTBOUND_RESEARCH',
        });

        const response = await POST(req);
        const json = await response.json();

        expect(response.status).toBe(401);
        expect(json.success).toBe(false);
        expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('requires source field', async () => {
        const req = createMockRequest({
            email: 'test@example.com',
            // Missing source
        });

        const response = await POST(req);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('normalizes email to lowercase', async () => {
        const createdProspect = {
            id: 'prospect-789',
            workspaceId: mockWorkspaceId,
            email: 'test@example.com',
            firstName: null,
            lastName: null,
            company: null,
            title: null,
            phone: null,
            linkedinUrl: null,
            source: 'OTHER',
            sourceDetail: 'Manual entry',
            status: 'NEW',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockPrisma.prospect.create.mockResolvedValue(createdProspect);

        const req = createMockRequest({
            email: 'TEST@EXAMPLE.COM',
            source: 'OTHER',
            sourceDetail: 'Manual entry',
        });

        const response = await POST(req);

        expect(response.status).toBe(201);
        expect(mockPrisma.prospect.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    email: 'test@example.com',
                }),
            })
        );
    });
});
