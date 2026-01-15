import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureWorkspaceForUser } from '@/lib/services/workspace-service'
import { prisma } from '@/lib/prisma/client'

// Mock Prisma
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        workspace: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
    },
}))

describe('Workspace Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('ensureWorkspaceForUser', () => {
        it('should return existing workspace if found', async () => {
            const mockWorkspace = {
                id: 'workspace-123',
                name: 'My Workspace',
                userId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            vi.mocked(prisma.workspace.findFirst).mockResolvedValue(mockWorkspace as any)

            const result = await ensureWorkspaceForUser('user-123')

            expect(prisma.workspace.findFirst).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
            })
            expect(prisma.workspace.create).not.toHaveBeenCalled()
            expect(result).toEqual(mockWorkspace)
        })

        it('should create new workspace if none exists', async () => {
            vi.mocked(prisma.workspace.findFirst).mockResolvedValue(null)

            const newWorkspace = {
                id: 'workspace-new',
                name: 'My Workspace',
                userId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            vi.mocked(prisma.workspace.create).mockResolvedValue(newWorkspace as any)

            const result = await ensureWorkspaceForUser('user-123')

            expect(prisma.workspace.findFirst).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
            })
            expect(prisma.workspace.create).toHaveBeenCalledWith({
                data: {
                    name: 'My Workspace',
                    userId: 'user-123',
                },
            })
            expect(result).toEqual(newWorkspace)
        })
    })
})
