import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/user/workspace/route'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('@/lib/guardrails/workspace-check', () => ({
    getWorkspaceId: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getWorkspaceId } from '@/lib/guardrails/workspace-check'

describe('GET /api/user/workspace', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return 401 if user is not authenticated', async () => {
        vi.mocked(createClient).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            },
        } as any)

        const request = new NextRequest('http://localhost:3000/api/user/workspace')
        const response = await GET(request)
        const body = await response.json()

        expect(response.status).toBe(401)
        expect(body.success).toBe(false)
        expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('should return workspace id if authenticated', async () => {
        vi.mocked(createClient).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: {
                        user: { id: 'user-123' }
                    }
                }),
            },
        } as any)

        vi.mocked(getWorkspaceId).mockResolvedValue('ws-123')

        const request = new NextRequest('http://localhost:3000/api/user/workspace')
        const response = await GET(request)
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data.workspaceId).toBe('ws-123')
    })

    it('should return 404 if workspace not found', async () => {
        vi.mocked(createClient).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: {
                        user: { id: 'user-123' }
                    }
                }),
            },
        } as any)

        vi.mocked(getWorkspaceId).mockRejectedValue(new Error('No workspace found'))

        const request = new NextRequest('http://localhost:3000/api/user/workspace')
        const response = await GET(request)
        const body = await response.json()

        expect(response.status).toBe(404)
        expect(body.success).toBe(false)
        expect(body.error.code).toBe('NOT_FOUND')
    })
})
