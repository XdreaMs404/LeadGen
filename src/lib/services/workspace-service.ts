import { prisma } from "@/lib/prisma/client";

/**
 * Ensures a workspace exists for a given user.
 * If no workspace exists where the user is the owner, a new one is created.
 *
 * @param userId - The ID of the authenticated user
 * @param email - The email of the authenticated user (unused for now but kept for future use)
 * @returns The existing or newly created workspace
 */
export async function ensureWorkspaceForUser(userId: string) {
    // Idempotency: Check if user already owns a workspace
    const existingWorkspace = await prisma.workspace.findFirst({
        where: {
            userId: userId,
        },
    });

    if (existingWorkspace) {
        return existingWorkspace;
    }

    // Create new workspace if none exists
    return await prisma.workspace.create({
        data: {
            name: "My Workspace",
            userId: userId,
        },
    });
}
