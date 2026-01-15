import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { NextRequest } from 'next/server'

// Mock user sync service
vi.mock('@/lib/services/user-sync', () => ({
    syncUserFromAuth: vi.fn().mockResolvedValue({}),
}))

// Mock workspace service
vi.mock('@/lib/services/workspace-service', () => ({
    ensureWorkspaceForUser: vi.fn().mockResolvedValue({ id: 'workspace-123' }),
}))


// Create mock at module level but configure inside factory
vi.mock('@/lib/supabase/server', () => {
    const mockExchangeCodeForSession = vi.fn()
    const mockGetUser = vi.fn()
    return {
        createClient: vi.fn().mockResolvedValue({
            auth: {
                exchangeCodeForSession: mockExchangeCodeForSession,
                getUser: mockGetUser,
            },
        }),
    }
})

// Import after mocking
import { GET } from '@/app/auth/callback/route'
import { createClient } from '@/lib/supabase/server'
import { syncUserFromAuth } from '@/lib/services/user-sync'
import { ensureWorkspaceForUser } from '@/lib/services/workspace-service'


describe('Auth Callback Handler', () => {
    let mockExchangeCodeForSession: Mock
    let mockGetUser: Mock

    beforeEach(async () => {
        vi.clearAllMocks()
        // Get the mocks from the mocked module
        const supabase = await createClient()
        mockExchangeCodeForSession = supabase.auth.exchangeCodeForSession as Mock
        mockGetUser = supabase.auth.getUser as Mock

        // Default mock for getUser
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: 'test-user-id',
                    email: 'test@example.com',
                    user_metadata: {
                        full_name: 'Test User',
                        avatar_url: 'https://example.com/avatar.jpg',
                    },
                },
            },
        })

        // Reset workspace service mock to success by default
        vi.mocked(ensureWorkspaceForUser).mockResolvedValue({ id: 'workspace-123' } as any)
    })

    it('should redirect to dashboard on successful code exchange', async () => {
        mockExchangeCodeForSession.mockResolvedValue({ error: null })

        const request = new NextRequest('http://localhost:3000/auth/callback?code=test-auth-code')
        const response = await GET(request)

        expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-auth-code')
        expect(response.status).toBe(307) // Redirect status
        expect(response.headers.get('Location')).toBe('http://localhost:3000/dashboard')
    })

    it('should sync user data after successful authentication', async () => {
        mockExchangeCodeForSession.mockResolvedValue({ error: null })

        const request = new NextRequest('http://localhost:3000/auth/callback?code=test-code')
        await GET(request)

        expect(syncUserFromAuth).toHaveBeenCalledWith({
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            avatarUrl: 'https://example.com/avatar.jpg',
        })

        expect(ensureWorkspaceForUser).toHaveBeenCalledWith('test-user-id')
    })

    it('should redirect with error if workspace creation fails', async () => {
        mockExchangeCodeForSession.mockResolvedValue({ error: null })
        vi.mocked(ensureWorkspaceForUser).mockRejectedValue(new Error('DB Error'))

        const request = new NextRequest('http://localhost:3000/auth/callback?code=test-code')
        const response = await GET(request)

        expect(response.headers.get('Location')).toBe('http://localhost:3000/dashboard?error=workspace_setup_failed')
    })


    it('should redirect to custom next URL when provided', async () => {
        mockExchangeCodeForSession.mockResolvedValue({ error: null })

        const request = new NextRequest('http://localhost:3000/auth/callback?code=test-code&next=/onboarding')
        const response = await GET(request)

        expect(response.headers.get('Location')).toBe('http://localhost:3000/onboarding')
    })

    it('should redirect to login with error when code exchange fails', async () => {
        mockExchangeCodeForSession.mockResolvedValue({
            error: { message: 'Invalid code' }
        })

        const request = new NextRequest('http://localhost:3000/auth/callback?code=invalid-code')
        const response = await GET(request)

        expect(response.headers.get('Location')).toBe('http://localhost:3000/login?error=auth_failed')
    })

    it('should redirect to login when no code is provided', async () => {
        const request = new NextRequest('http://localhost:3000/auth/callback')
        const response = await GET(request)

        expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
        expect(response.headers.get('Location')).toBe('http://localhost:3000/login?error=auth_failed')
    })
})

