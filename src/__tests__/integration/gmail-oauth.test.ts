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
        gmailToken: {
            upsert: vi.fn(),
        },
    },
}));

vi.mock('@/lib/crypto/encrypt', () => ({
    encrypt: vi.fn((text: string) => `encrypted:${text}`),
}));

vi.mock('next/headers', () => ({
    cookies: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    })),
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { cookies } from 'next/headers';

describe('Gmail OAuth Integration', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        vi.stubEnv('GMAIL_CLIENT_ID', 'test-client-id');
        vi.stubEnv('GMAIL_CLIENT_SECRET', 'test-client-secret');
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe('GET /api/auth/gmail', () => {
        it('should redirect to Google OAuth with correct scopes', async () => {
            // Mock authenticated user
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            // Mock auth check
            vi.mocked(createClient).mockResolvedValueOnce({
                auth: {
                    getUser: vi.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            } as never);

            // Import and call the route handler
            const { GET } = await import('@/app/api/auth/gmail/route');
            const mockRequest = new NextRequest('http://localhost:3000/api/auth/gmail');
            const response = await GET(mockRequest);

            // Should be a redirect
            expect(response.status).toBe(307); // Redirect status

            // Check cookie was set on response
            expect(response.cookies.get('gmail_oauth_state')).toBeDefined();
            expect(response.cookies.get('gmail_oauth_state')?.value).toBeDefined();

            // Check the redirect URL
            const location = response.headers.get('location');
            expect(location).toContain('accounts.google.com/o/oauth2/v2/auth');
            expect(location).toContain('gmail.send');
            expect(location).toContain('gmail.readonly');
            expect(location).toContain('gmail.modify');
            expect(location).toContain('include_granted_scopes=true');
            expect(location).toContain('access_type=offline');
        });

        it('should return 401 if user is not authenticated', async () => {
            // Mock specifically for this test
            vi.doMock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({
                    auth: {
                        getUser: vi.fn().mockResolvedValue({
                            data: { user: null },
                            error: { message: 'Not authenticated' },
                        }),
                    },
                }),
            }));

            // Import route handler (will use the doMock above)
            const { GET } = await import('@/app/api/auth/gmail/route');
            const mockRequest = new NextRequest('http://localhost:3000/api/auth/gmail');

            const response = await GET(mockRequest);

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });
    });

    describe('GET /api/auth/gmail/callback', () => {
        it('should redirect with error if access_denied', async () => {
            const mockCookies = {
                get: vi.fn(),
                delete: vi.fn(),
            };
            vi.mocked(cookies).mockResolvedValueOnce(mockCookies as never);

            const request = new NextRequest(
                'http://localhost:3000/api/auth/gmail/callback?error=access_denied'
            );

            const { GET } = await import('@/app/api/auth/gmail/callback/route');
            const response = await GET(request);

            expect(response.status).toBe(307);
            const location = response.headers.get('location');
            expect(location).toContain('error=GMAIL_SCOPE_DENIED');
        });

        it('should redirect with error if state mismatch', async () => {
            const mockCookies = {
                get: vi.fn().mockReturnValue({ value: 'stored-state' }),
                delete: vi.fn(),
            };
            vi.mocked(cookies).mockResolvedValueOnce(mockCookies as never);

            const request = new NextRequest(
                'http://localhost:3000/api/auth/gmail/callback?code=auth-code&state=wrong-state'
            );

            const { GET } = await import('@/app/api/auth/gmail/callback/route');
            const response = await GET(request);

            expect(response.status).toBe(307);
            const location = response.headers.get('location');
            expect(location).toContain('error=INVALID_STATE');
        });
    });
});
