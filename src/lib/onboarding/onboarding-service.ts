import { prisma } from '@/lib/prisma/client';

/**
 * Check if onboarding conditions are met and update the flag in database.
 * Called after DNS validation success and Gmail token save.
 */
export async function checkAndUpdateOnboardingComplete(workspaceId: string): Promise<boolean> {
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { gmailToken: true },
    });

    if (!workspace) {
        return false;
    }

    const isComplete = isOnboardingComplete(workspace);

    if (isComplete !== workspace.onboardingComplete) {
        await prisma.workspace.update({
            where: { id: workspaceId },
            data: { onboardingComplete: isComplete },
        });
    }

    return isComplete;
}

/**
 * Determine if all onboarding steps are complete.
 * Conditions: Gmail connected AND (SPF PASS or MANUAL_OVERRIDE) AND (DKIM PASS or MANUAL_OVERRIDE) AND (DMARC PASS or MANUAL_OVERRIDE)
 */
export function isOnboardingComplete(workspace: {
    gmailToken?: { id: string } | null;
    spfStatus: string;
    dkimStatus: string;
    dmarcStatus: string;
}): boolean {
    const gmailOk = workspace.gmailToken !== null && workspace.gmailToken !== undefined;
    const spfOk = workspace.spfStatus === 'PASS' || workspace.spfStatus === 'MANUAL_OVERRIDE';
    const dkimOk = workspace.dkimStatus === 'PASS' || workspace.dkimStatus === 'MANUAL_OVERRIDE';
    const dmarcOk = workspace.dmarcStatus === 'PASS' || workspace.dmarcStatus === 'MANUAL_OVERRIDE';

    return gmailOk && spfOk && dkimOk && dmarcOk;
}

/**
 * Calculate onboarding progress percentage.
 * Returns a value from 0-100 based on completed steps (4 total).
 */
export function calculateProgress(workspace: {
    gmailToken?: { id: string } | null;
    spfStatus: string;
    dkimStatus: string;
    dmarcStatus: string;
}): number {
    let completed = 0;

    if (workspace.gmailToken !== null && workspace.gmailToken !== undefined) {
        completed++;
    }
    if (workspace.spfStatus === 'PASS' || workspace.spfStatus === 'MANUAL_OVERRIDE') {
        completed++;
    }
    if (workspace.dkimStatus === 'PASS' || workspace.dkimStatus === 'MANUAL_OVERRIDE') {
        completed++;
    }
    if (workspace.dmarcStatus === 'PASS' || workspace.dmarcStatus === 'MANUAL_OVERRIDE') {
        completed++;
    }

    return (completed / 4) * 100;
}
