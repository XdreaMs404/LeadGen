import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check'
import { prisma } from '@/lib/prisma/client'

// Mock Prisma
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        workspace: {
            findFirst: vi.fn(),
        },
    },
}))

describe('Workspace Guardrails', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('assertWorkspaceAccess', () => {
        it('should pass if user owns the workspace', async () => {
            vi.mocked(prisma.workspace.findFirst).mockResolvedValue({ id: 'ws-123', userId: 'user-123' } as any)
            await expect(assertWorkspaceAccess('user-123', 'ws-123')).resolves.not.toThrow()
        })

        it('should throw error if user does not have access', async () => {
            vi.mocked(prisma.workspace.findFirst).mockResolvedValue(null)
            await expect(assertWorkspaceAccess('user-123', 'ws-123')).rejects.toThrow('Unauthorized workspace access')
        })
    })

    describe('getWorkspaceId', () => {
        it('should return workspace id if found', async () => {
            vi.mocked(prisma.workspace.findFirst).mockResolvedValue({ id: 'ws-123', userId: 'user-123' } as any)
            const workspaceId = await getWorkspaceId('user-123')
            expect(workspaceId).toBe('ws-123')
        })

        it('should throw error if no workspace found', async () => {
            vi.mocked(prisma.workspace.findFirst).mockResolvedValue(null)
            await expect(getWorkspaceId('user-123')).rejects.toThrow('No workspace found for user')
        })
    })
})
