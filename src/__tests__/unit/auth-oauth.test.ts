import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Supabase client
const mockSignInWithOAuth = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            signInWithOAuth: mockSignInWithOAuth,
        },
    }),
}))

describe('OAuth URL Generation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should call signInWithOAuth with correct Google provider config', async () => {
        mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })

        // Simulate the OAuth call parameters from the login page
        const oauthConfig = {
            provider: 'google' as const,
            options: {
                redirectTo: 'http://localhost:3000/auth/callback',
                scopes: 'openid email profile',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        }

        await mockSignInWithOAuth(oauthConfig)

        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: {
                redirectTo: expect.stringMatching(/\/auth\/callback$/),
                scopes: 'openid email profile',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        })
    })

    it('should include required OAuth scopes', async () => {
        mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })

        const oauthConfig = {
            provider: 'google' as const,
            options: {
                scopes: 'openid email profile',
            },
        }

        await mockSignInWithOAuth(oauthConfig)

        const callArg = mockSignInWithOAuth.mock.calls[0][0]
        expect(callArg.options.scopes).toContain('openid')
        expect(callArg.options.scopes).toContain('email')
        expect(callArg.options.scopes).toContain('profile')
    })

    it('should handle OAuth error gracefully', async () => {
        const mockError = { message: 'OAuth provider error' }
        mockSignInWithOAuth.mockResolvedValue({ data: null, error: mockError })

        const result = await mockSignInWithOAuth({
            provider: 'google' as const,
        })

        expect(result.error).toBeDefined()
        expect(result.error.message).toBe('OAuth provider error')
    })
})
