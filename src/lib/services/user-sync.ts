import { prisma } from '@/lib/prisma/client'

interface SyncUserData {
    id: string
    email: string
    name?: string | null
    avatarUrl?: string | null
}

/**
 * Sync user data from Supabase Auth to our database.
 * Creates a new user if they don't exist, updates if they do.
 * This is idempotent - safe to call multiple times.
 */
export async function syncUserFromAuth(userData: SyncUserData) {
    const { id, email, name, avatarUrl } = userData

    return prisma.user.upsert({
        where: { id },
        create: {
            id,
            email,
            name: name ?? null,
            avatarUrl: avatarUrl ?? null,
        },
        update: {
            email, // Email can change if Google account is updated
            name: name ?? undefined,
            avatarUrl: avatarUrl ?? undefined,
        },
    })
}
