import { prisma } from "@/lib/prisma/client";

/**
 * Asserts that a user has access to a specific workspace.
 * Throws an error if access is denied.
 *
 * @param userId - The ID of the authenticated user
 * @param workspaceId - The ID of the workspace to check
 */
export async function assertWorkspaceAccess(userId: string, workspaceId: string): Promise<void> {
    const workspace = await prisma.workspace.findFirst({
        where: {
            id: workspaceId,
            userId: userId, // Ensure ownership (for MVP)
        },
    });

    if (!workspace) {
        throw new Error("Unauthorized workspace access");
    }
}

/**
 * Retrieves the primary workspace ID for a user.
 * Throws an error if no workspace is found.
 *
 * @param userId - The ID of the authenticated user
 * @returns The workspace ID
 */
export async function getWorkspaceId(userId: string): Promise<string> {
    const workspace = await prisma.workspace.findFirst({
        where: {
            userId: userId,
        },
        select: {
            id: true,
        },
    });

    if (!workspace) {
        throw new Error("No workspace found for user");
    }

    return workspace.id;
}
