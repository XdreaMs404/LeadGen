import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
    createServerClient: () => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
    }),
}));

describe('Middleware Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should redirect unauthenticated user from protected route to login', async () => {
        // Create a mock request for a protected route
        const request = new NextRequest(new URL('http://localhost:3000/dashboard'));

        // Execute middleware
        const response = await middleware(request);

        // Check for redirect
        expect(response.status).toBe(307); // Next.js redirect status
        expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('should allow unauthenticated access to public routes', async () => {
        const request = new NextRequest(new URL('http://localhost:3000/'));

        const response = await middleware(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
    });
});
