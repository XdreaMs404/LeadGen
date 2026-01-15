import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/prisma/client'

describe('Prisma Client Verification', () => {
    it('should instantiate without error', async () => {
        expect(prisma).toBeDefined()
        // Try a simple query
        try {
            const count = await prisma.user.count()
            console.log('User count:', count)
            expect(count).toBeGreaterThanOrEqual(0)
        } catch (e) {
            console.error('Prisma Error:', e)
            throw e
        }
    })
})
