import { prisma } from '@/lib/prisma/client';
import type { PreSendCheckResult } from '@/types/guardrails';
import { isTokenValid } from '@/lib/gmail/token-service';

/**
 * Pre-send check service - NON-BYPASSABLE guardrail
 * 
 * Checks all pre-conditions before allowing email sending:
 * 1. Onboarding complete
 * 2. Gmail connected (GmailToken exists)
 * 3. Gmail token valid (not expired)
 * 
 * @param workspaceId - The workspace to check
 * @returns PreSendCheckResult indicating if sending is allowed
 */
export async function checkCanSend(workspaceId: string): Promise<PreSendCheckResult> {
    // Fetch workspace with Gmail token status
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
            onboardingComplete: true,
            gmailToken: {
                select: { id: true },
            },
        },
    });

    if (!workspace) {
        return {
            canSend: false,
            code: 'WORKSPACE_NOT_FOUND',
            blockedReason: 'Espace de travail introuvable',
        };
    }

    // Check 1: Onboarding complete
    if (!workspace.onboardingComplete) {
        return {
            canSend: false,
            code: 'ONBOARDING_INCOMPLETE',
            blockedReason: 'Complétez la configuration de délivrabilité d\'abord',
        };
    }

    // Check 2: Gmail connected (GmailToken record exists)
    if (!workspace.gmailToken) {
        return {
            canSend: false,
            code: 'GMAIL_NOT_CONNECTED',
            blockedReason: 'Connectez votre compte Gmail',
        };
    }

    // Check 3: Gmail token validity (not expired, can refresh)
    const tokenValid = await isTokenValid(workspaceId);
    if (!tokenValid) {
        return {
            canSend: false,
            code: 'GMAIL_TOKEN_INVALID',
            blockedReason: 'Votre connexion Gmail a expiré',
        };
    }

    // All checks passed
    return { canSend: true };
}
