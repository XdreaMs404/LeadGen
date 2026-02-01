import { prisma } from '@/lib/prisma/client';
import { GMAIL_DOMAINS, extractDomainFromEmail } from '@/lib/constants/dns-providers';

/**
 * Check if a Gmail email is from a personal Gmail domain (@gmail.com, @googlemail.com)
 * Personal Gmail accounts have DNS (SPF/DKIM) managed by Google automatically.
 */
function isPersonalGmailEmail(email?: string | null): boolean {
    if (!email) return false;
    const domain = extractDomainFromEmail(email);
    return domain !== null && GMAIL_DOMAINS.includes(domain);
}

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
 * Conditions: Gmail connected AND (SPF PASS or MANUAL_OVERRIDE or Personal Gmail) AND same for DKIM/DMARC
 */
export function isOnboardingComplete(workspace: {
    gmailToken?: { id: string; email?: string } | null;
    spfStatus: string;
    dkimStatus: string;
    dmarcStatus: string;
}): boolean {
    const gmailOk = workspace.gmailToken !== null && workspace.gmailToken !== undefined;

    // Personal Gmail accounts (@gmail.com, @googlemail.com) have DNS managed by Google
    const isPersonalGmail = isPersonalGmailEmail(workspace.gmailToken?.email);

    const spfOk = isPersonalGmail || workspace.spfStatus === 'PASS' || workspace.spfStatus === 'MANUAL_OVERRIDE';
    const dkimOk = isPersonalGmail || workspace.dkimStatus === 'PASS' || workspace.dkimStatus === 'MANUAL_OVERRIDE';
    const dmarcOk = isPersonalGmail || workspace.dmarcStatus === 'PASS' || workspace.dmarcStatus === 'MANUAL_OVERRIDE';

    return gmailOk && spfOk && dkimOk && dmarcOk;
}

/**
 * Calculate onboarding progress percentage.
 * Returns a value from 0-100 based on completed steps (4 total).
 */
export function calculateProgress(workspace: {
    gmailToken?: { id: string; email?: string } | null;
    spfStatus: string;
    dkimStatus: string;
    dmarcStatus: string;
}): number {
    let completed = 0;

    // Personal Gmail accounts get DNS steps auto-completed
    const isPersonalGmail = isPersonalGmailEmail(workspace.gmailToken?.email);

    if (workspace.gmailToken !== null && workspace.gmailToken !== undefined) {
        completed++;
    }
    if (isPersonalGmail || workspace.spfStatus === 'PASS' || workspace.spfStatus === 'MANUAL_OVERRIDE') {
        completed++;
    }
    if (isPersonalGmail || workspace.dkimStatus === 'PASS' || workspace.dkimStatus === 'MANUAL_OVERRIDE') {
        completed++;
    }
    if (isPersonalGmail || workspace.dmarcStatus === 'PASS' || workspace.dmarcStatus === 'MANUAL_OVERRIDE') {
        completed++;
    }

    return (completed / 4) * 100;
}
