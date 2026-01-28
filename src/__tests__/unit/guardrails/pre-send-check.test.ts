import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        workspace: {
            findUnique: vi.fn(),
        },
    },
}));

// Mock token service
vi.mock('@/lib/gmail/token-service', () => ({
    isTokenValid: vi.fn(),
}));

import { checkCanSend } from '@/lib/guardrails/pre-send-check';
import { prisma } from '@/lib/prisma/client';
import { isTokenValid } from '@/lib/gmail/token-service';

describe('Pre-Send Check Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('checkCanSend', () => {
        it('should return canSend: false with WORKSPACE_NOT_FOUND when workspace does not exist', async () => {
            vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce(null);

            const result = await checkCanSend('non-existent-workspace');

            expect(result).toEqual({
                canSend: false,
                code: 'WORKSPACE_NOT_FOUND',
                blockedReason: 'Espace de travail introuvable',
            });
        });

        it('should return canSend: false with ONBOARDING_INCOMPLETE when onboarding is not complete', async () => {
            vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
                onboardingComplete: false,
                gmailToken: { id: 'token-123' },
            } as never);

            const result = await checkCanSend('workspace-123');

            expect(result).toEqual({
                canSend: false,
                code: 'ONBOARDING_INCOMPLETE',
                blockedReason: 'Complétez la configuration de délivrabilité d\'abord',
            });
        });

        it('should return canSend: false with GMAIL_NOT_CONNECTED when no Gmail token exists', async () => {
            vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
                onboardingComplete: true,
                gmailToken: null,
            } as never);

            const result = await checkCanSend('workspace-123');

            expect(result).toEqual({
                canSend: false,
                code: 'GMAIL_NOT_CONNECTED',
                blockedReason: 'Connectez votre compte Gmail',
            });
        });

        it('should return canSend: false with GMAIL_TOKEN_INVALID when token is expired or invalid', async () => {
            vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
                onboardingComplete: true,
                gmailToken: { id: 'token-123' },
            } as never);
            vi.mocked(isTokenValid).mockResolvedValueOnce(false);

            const result = await checkCanSend('workspace-123');

            expect(result).toEqual({
                canSend: false,
                code: 'GMAIL_TOKEN_INVALID',
                blockedReason: 'Votre connexion Gmail a expiré',
            });
        });

        it('should return canSend: true when all conditions are met', async () => {
            vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
                onboardingComplete: true,
                gmailToken: { id: 'token-123' },
            } as never);
            vi.mocked(isTokenValid).mockResolvedValueOnce(true);

            const result = await checkCanSend('workspace-123');

            expect(result).toEqual({
                canSend: true,
            });
        });

        it('should check conditions in correct order: onboarding -> gmail connected -> token valid', async () => {
            // Test that gmailConnected is not checked if onboarding is incomplete
            vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
                onboardingComplete: false,
                gmailToken: null, // Even though no token, should return ONBOARDING_INCOMPLETE first
            } as never);

            const result = await checkCanSend('workspace-123');

            expect(result.code).toBe('ONBOARDING_INCOMPLETE');
            expect(isTokenValid).not.toHaveBeenCalled(); // Token validation should not be called
        });

        it('should not check token validity if Gmail is not connected', async () => {
            vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
                onboardingComplete: true,
                gmailToken: null,
            } as never);

            const result = await checkCanSend('workspace-123');

            expect(result.code).toBe('GMAIL_NOT_CONNECTED');
            expect(isTokenValid).not.toHaveBeenCalled();
        });
    });
});
