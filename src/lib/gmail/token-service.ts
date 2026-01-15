import { prisma } from '@/lib/prisma/client';
import { encrypt, decrypt } from '@/lib/crypto/encrypt';

/**
 * Token buffer time - refresh token if it expires within this time
 */
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Exponential backoff configuration per NFR19
 */
const BACKOFF_CONFIG = {
    initialDelayMs: 100,
    maxRetries: 3,
    multiplier: 2,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Refreshes Gmail access token using refresh token
 */
async function refreshAccessToken(
    refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.GMAIL_CLIENT_ID!,
            client_secret: process.env.GMAIL_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();

        // Handle revoked tokens specifically
        if (errorData.includes('invalid_grant')) {
            throw new Error('GMAIL_TOKEN_REVOKED');
        }

        throw new Error(`Token refresh failed: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    return {
        accessToken: data.access_token,
        expiresAt,
    };
}

/**
 * Token refresh result
 */
export interface TokenResult {
    accessToken: string;
    email: string;
}

/**
 * Gets a valid Gmail access token for the workspace.
 * 
 * - Returns cached token if not expired (with 5 min buffer)
 * - Refreshes token with exponential backoff if expired
 * - Updates database with new token on refresh
 * 
 * @param workspaceId - The workspace ID to get token for
 * @returns Token result with access token and email
 * @throws Error if no token exists or refresh fails after retries
 */
export async function getValidToken(workspaceId: string): Promise<TokenResult> {
    const gmailToken = await prisma.gmailToken.findUnique({
        where: { workspaceId },
    });

    if (!gmailToken) {
        throw new Error('NO_GMAIL_TOKEN');
    }

    const now = Date.now();
    const expiresAt = gmailToken.expiresAt.getTime();

    // Check if token is still valid (with buffer)
    if (expiresAt - now > TOKEN_EXPIRY_BUFFER_MS) {
        return {
            accessToken: decrypt(gmailToken.accessToken),
            email: gmailToken.email,
        };
    }

    // Token expired or expiring soon - refresh with exponential backoff
    const decryptedRefreshToken = decrypt(gmailToken.refreshToken);
    let lastError: Error | null = null;
    let delayMs = BACKOFF_CONFIG.initialDelayMs;

    for (let attempt = 0; attempt <= BACKOFF_CONFIG.maxRetries; attempt++) {
        try {
            const { accessToken, expiresAt: newExpiresAt } = await refreshAccessToken(
                decryptedRefreshToken
            );

            // Update token in database
            await prisma.gmailToken.update({
                where: { workspaceId },
                data: {
                    accessToken: encrypt(accessToken),
                    expiresAt: newExpiresAt,
                },
            });

            return {
                accessToken,
                email: gmailToken.email,
            };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Immediate fail if token is definitely revoked
            if (lastError.message === 'GMAIL_TOKEN_REVOKED') {
                console.error('Gmail token revoked by provider, cleaning up...');
                try {
                    await prisma.gmailToken.delete({ where: { workspaceId } });
                } catch {
                    // Ignore delete error if already gone
                }
                throw new Error('GMAIL_RELOGIN_REQUIRED');
            }

            console.error(
                `Token refresh attempt ${attempt + 1}/${BACKOFF_CONFIG.maxRetries} failed:`,
                lastError.message
            );

            if (attempt < BACKOFF_CONFIG.maxRetries - 1) {
                await sleep(delayMs);
                delayMs *= BACKOFF_CONFIG.multiplier;
            }
        }
    }

    throw new Error(`TOKEN_REFRESH_FAILED: ${lastError?.message}`);
}

/**
 * Checks if a workspace has Gmail connected
 * 
 * @param workspaceId - The workspace ID to check
 * @returns Object with connected status and email if connected
 */
export async function getGmailConnectionStatus(
    workspaceId: string
): Promise<{ connected: boolean; email?: string }> {
    const gmailToken = await prisma.gmailToken.findUnique({
        where: { workspaceId },
        select: { email: true },
    });

    return {
        connected: !!gmailToken,
        email: gmailToken?.email,
    };
}

/**
 * Revokes Gmail token and removes from database
 * 
 * @param workspaceId - The workspace ID to revoke token for
 * @returns true if token was revoked, false if no token existed
 */
export async function revokeGmailToken(workspaceId: string): Promise<boolean> {
    const gmailToken = await prisma.gmailToken.findUnique({
        where: { workspaceId },
    });

    if (!gmailToken) {
        return false;
    }

    try {
        // Revoke token with Google
        const accessToken = decrypt(gmailToken.accessToken);
        await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
    } catch (error) {
        // Log but continue - we still want to delete the local record
        console.error('Failed to revoke token with Google:', error);
    }

    // Delete from database
    await prisma.gmailToken.delete({
        where: { workspaceId },
    });

    return true;
}
