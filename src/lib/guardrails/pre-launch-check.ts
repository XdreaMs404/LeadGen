import { prisma } from '@/lib/prisma/client';
import { isTokenValid } from '@/lib/gmail/token-service';
import { isOnboardingComplete } from '@/lib/onboarding/onboarding-service';

/**
 * Pre-launch check issue codes
 */
export type PreLaunchIssueCode =
    | 'ONBOARDING_INCOMPLETE'
    | 'GMAIL_NOT_CONNECTED'
    | 'GMAIL_TOKEN_INVALID'
    | 'SEQUENCE_NOT_READY'
    | 'NO_PROSPECTS_SELECTED'
    | 'PROSPECTS_NOT_FOUND'
    | 'UNVERIFIED_PROSPECTS';

/**
 * Severity level for pre-launch issues
 * - error: Blocks launch completely
 * - warning: Allows launch but shows a warning
 */
export type PreLaunchIssueSeverity = 'error' | 'warning';

/**
 * Individual issue from pre-launch check
 */
export interface PreLaunchIssue {
    code: PreLaunchIssueCode;
    message: string;
    severity: PreLaunchIssueSeverity;
    details?: unknown;
}

/**
 * Result of pre-launch requirements check
 */
export interface PreLaunchCheckResult {
    canLaunch: boolean;
    issues: PreLaunchIssue[];
    warnings: PreLaunchIssue[];
}

/**
 * Pre-launch check service - NON-BYPASSABLE guardrail
 * 
 * Validates all preconditions before allowing campaign launch:
 * 1. Onboarding complete (deliverability setup)
 * 2. Gmail connected with valid tokens
 * 3. Sequence has READY status (Copilot preview completed)
 * 4. At least one prospect selected (unverified prospects generate warning, not error)
 * 
 * @param workspaceId - The workspace to check
 * @param sequenceId - The sequence to launch
 * @param prospectIds - The selected prospect IDs
 * @returns PreLaunchCheckResult indicating if launch is allowed
 */
export async function checkPreLaunchRequirements(
    workspaceId: string,
    sequenceId: string,
    prospectIds: string[]
): Promise<PreLaunchCheckResult> {
    const issues: PreLaunchIssue[] = [];

    // Fetch workspace with Gmail token status and DNS statuses
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
            spfStatus: true,
            dkimStatus: true,
            dmarcStatus: true,
            gmailToken: {
                select: { id: true, email: true },
            },
        },
    });

    if (!workspace) {
        return {
            canLaunch: false,
            issues: [{
                code: 'ONBOARDING_INCOMPLETE',
                message: 'Espace de travail introuvable',
                severity: 'error',
            }],
            warnings: [],
        };
    }

    // Check 1: Onboarding complete (deliverability setup)
    // Uses isOnboardingComplete which handles personal Gmail accounts (@gmail.com) automatically
    const onboardingComplete = isOnboardingComplete({
        gmailToken: workspace.gmailToken,
        spfStatus: workspace.spfStatus,
        dkimStatus: workspace.dkimStatus,
        dmarcStatus: workspace.dmarcStatus,
    });

    if (!onboardingComplete) {
        issues.push({
            code: 'ONBOARDING_INCOMPLETE',
            message: 'Complétez la configuration de délivrabilité',
            severity: 'error',
        });
    }

    // Check 2: Gmail connected
    if (!workspace.gmailToken) {
        issues.push({
            code: 'GMAIL_NOT_CONNECTED',
            message: 'Connectez votre compte Gmail',
            severity: 'error',
        });
    } else {
        // Check 3: Gmail token validity
        const tokenValid = await isTokenValid(workspaceId);
        if (!tokenValid) {
            issues.push({
                code: 'GMAIL_TOKEN_INVALID',
                message: 'Votre connexion Gmail a expiré. Veuillez vous reconnecter.',
                severity: 'error',
            });
        }
    }

    // Check 4: Sequence status is READY
    const sequence = await prisma.sequence.findUnique({
        where: { id: sequenceId },
        select: { status: true, name: true },
    });

    if (!sequence) {
        issues.push({
            code: 'SEQUENCE_NOT_READY',
            message: 'Séquence introuvable',
            severity: 'error',
        });
    } else if (sequence.status !== 'READY') {
        issues.push({
            code: 'SEQUENCE_NOT_READY',
            message: `La séquence "${sequence.name}" n'est pas validée. Complétez l'aperçu copilot.`,
            severity: 'error',
            details: { currentStatus: sequence.status },
        });
    }

    // Check 5: At least one prospect selected
    if (prospectIds.length === 0) {
        issues.push({
            code: 'NO_PROSPECTS_SELECTED',
            message: 'Aucun prospect sélectionné',
            severity: 'error',
        });
    } else {
        const prospects = await prisma.prospect.findMany({
            where: {
                id: { in: prospectIds },
                workspaceId: workspaceId,
                deletedAt: null,
            },
            select: { id: true, status: true, email: true },
        });

        // Check if all prospects were found (this is an error)
        if (prospects.length !== prospectIds.length) {
            const foundIds = new Set(prospects.map(p => p.id));
            const missingIds = prospectIds.filter(id => !foundIds.has(id));
            issues.push({
                code: 'PROSPECTS_NOT_FOUND',
                message: `${missingIds.length} prospect(s) introuvable(s)`,
                severity: 'error',
                details: { missingCount: missingIds.length },
            });
        }

        // Check for unverified prospects (this is a WARNING, not an error)
        const unverifiedProspects = prospects.filter(p => p.status !== 'VERIFIED');
        if (unverifiedProspects.length > 0) {
            issues.push({
                code: 'UNVERIFIED_PROSPECTS',
                message: `${unverifiedProspects.length} prospect(s) non vérifié(s)`,
                severity: 'warning',
                details: {
                    count: unverifiedProspects.length,
                    statuses: [...new Set(unverifiedProspects.map(p => p.status))],
                },
            });
        }
    }

    // Separate errors from warnings
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');

    return {
        canLaunch: errors.length === 0, // Can launch if no errors (warnings are OK)
        issues: errors,
        warnings,
    };
}
