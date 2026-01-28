import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        gmailToken: {
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

// Mock crypto
vi.mock('@/lib/crypto/encrypt', () => ({
    encrypt: vi.fn((text: string) => `encrypted:${text}`),
    decrypt: vi.fn((text: string) => text.replace('encrypted:', '')),
}));

import { getValidToken, getGmailConnectionStatus, revokeGmailToken, isTokenValid } from '@/lib/gmail/token-service';
import { prisma } from '@/lib/prisma/client';

describe('Gmail Token Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('GMAIL_CLIENT_ID', 'test-client-id');
        vi.stubEnv('GMAIL_CLIENT_SECRET', 'test-client-secret');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe('getGmailConnectionStatus', () => {
        it('should return connected=true when token exists', async () => {
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce({
                email: 'test@gmail.com',
            } as never);

            const result = await getGmailConnectionStatus('workspace-123');

            expect(result).toEqual({
                connected: true,
                email: 'test@gmail.com',
            });
        });

        it('should return connected=false when no token exists', async () => {
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce(null);

            const result = await getGmailConnectionStatus('workspace-123');

            expect(result).toEqual({
                connected: false,
                email: undefined,
            });
        });
    });

    describe('getValidToken', () => {
        it('should return cached token if not expired', async () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce({
                id: 'token-1',
                workspaceId: 'workspace-123',
                accessToken: 'encrypted:valid-access-token',
                refreshToken: 'encrypted:refresh-token',
                expiresAt: futureDate,
                email: 'test@gmail.com',
            } as never);

            const result = await getValidToken('workspace-123');

            expect(result).toEqual({
                accessToken: 'valid-access-token',
                email: 'test@gmail.com',
            });
            // Should not call update since token is still valid
            expect(prisma.gmailToken.update).not.toHaveBeenCalled();
        });

        it('should throw NO_GMAIL_TOKEN if no token exists', async () => {
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce(null);

            await expect(getValidToken('workspace-123')).rejects.toThrow('NO_GMAIL_TOKEN');
        });

        it('should refresh token when within expiry buffer (5 min)', async () => {
            // Token expires in 3 minutes (within 5 min buffer)
            const nearExpiryDate = new Date(Date.now() + 3 * 60 * 1000);
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce({
                id: 'token-1',
                workspaceId: 'workspace-123',
                accessToken: 'encrypted:old-access-token',
                refreshToken: 'encrypted:refresh-token',
                expiresAt: nearExpiryDate,
                email: 'test@gmail.com',
            } as never);

            // Mock successful token refresh after retries
            const mockFetch = vi.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockRejectedValueOnce(new Error('Fail 2'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        access_token: 'new-access-token',
                        expires_in: 3600,
                    }),
                });
            global.fetch = mockFetch;

            vi.mocked(prisma.gmailToken.update).mockResolvedValueOnce({} as never);

            // Use fake timers
            vi.useFakeTimers();

            const promise = getValidToken('workspace-123');

            // Advance time for backoff (100ms)
            await vi.advanceTimersByTimeAsync(100);

            // Advance time for backoff (200ms)
            await vi.advanceTimersByTimeAsync(200);

            const result = await promise;

            expect(result.accessToken).toBe('new-access-token');
            expect(mockFetch).toHaveBeenCalledTimes(3);

            // Verify Prisma update
            expect(prisma.gmailToken.update).toHaveBeenCalled();

            vi.useRealTimers();
        });
    });

    describe('revokeGmailToken', () => {
        it('should return false if no token exists', async () => {
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce(null);

            const result = await revokeGmailToken('workspace-123');

            expect(result).toBe(false);
            expect(prisma.gmailToken.delete).not.toHaveBeenCalled();
        });

        it('should revoke and delete token when exists', async () => {
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce({
                id: 'token-1',
                workspaceId: 'workspace-123',
                accessToken: 'encrypted:access-token',
                refreshToken: 'encrypted:refresh-token',
                expiresAt: new Date(),
                email: 'test@gmail.com',
            } as never);

            // Mock Google revoke endpoint
            const mockFetch = vi.fn().mockResolvedValueOnce({ ok: true });
            global.fetch = mockFetch;

            vi.mocked(prisma.gmailToken.delete).mockResolvedValueOnce({} as never);

            const result = await revokeGmailToken('workspace-123');

            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('oauth2.googleapis.com/revoke'),
                expect.objectContaining({ method: 'POST' })
            );
            expect(prisma.gmailToken.delete).toHaveBeenCalledWith({
                where: { workspaceId: 'workspace-123' },
            });
        });

        it('should delete token even if Google revoke fails', async () => {
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce({
                id: 'token-1',
                workspaceId: 'workspace-123',
                accessToken: 'encrypted:access-token',
                refreshToken: 'encrypted:refresh-token',
                expiresAt: new Date(),
                email: 'test@gmail.com',
            } as never);

            // Mock Google revoke endpoint failure
            const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
            global.fetch = mockFetch;

            vi.mocked(prisma.gmailToken.delete).mockResolvedValueOnce({} as never);

            const result = await revokeGmailToken('workspace-123');

            expect(result).toBe(true);
            expect(prisma.gmailToken.delete).toHaveBeenCalled();
        });
    });

    describe('isTokenValid', () => {
        it('should return true when token exists and is valid', async () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce({
                id: 'token-1',
                workspaceId: 'workspace-123',
                accessToken: 'encrypted:valid-access-token',
                refreshToken: 'encrypted:refresh-token',
                expiresAt: futureDate,
                email: 'test@gmail.com',
            } as never);

            const result = await isTokenValid('workspace-123');

            expect(result).toBe(true);
        });

        it('should return false when no token exists', async () => {
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce(null);

            const result = await isTokenValid('workspace-123');

            expect(result).toBe(false);
        });

        it('should return false when token refresh fails', async () => {
            // Token is expired
            const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
            vi.mocked(prisma.gmailToken.findUnique).mockResolvedValueOnce({
                id: 'token-1',
                workspaceId: 'workspace-123',
                accessToken: 'encrypted:old-access-token',
                refreshToken: 'encrypted:refresh-token',
                expiresAt: pastDate,
                email: 'test@gmail.com',
            } as never);

            // Mock failed refresh
            const mockFetch = vi.fn().mockResolvedValue({
                ok: false,
                text: async () => 'invalid_grant',
            });
            global.fetch = mockFetch;

            vi.useFakeTimers();

            const promise = isTokenValid('workspace-123');

            // Advance through backoff delays
            await vi.advanceTimersByTimeAsync(100);
            await vi.advanceTimersByTimeAsync(200);
            await vi.advanceTimersByTimeAsync(400);

            const result = await promise;

            expect(result).toBe(false);

            vi.useRealTimers();
        });
    });
});
