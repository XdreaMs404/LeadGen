import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock modules BEFORE imports - using factory functions instead of top-level variables
vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        workspace: {
            findUnique: vi.fn(),
        },
        sequence: {
            findUnique: vi.fn(),
        },
        prospect: {
            findMany: vi.fn(),
        },
    },
}));

vi.mock('@/lib/gmail/token-service', () => ({
    isTokenValid: vi.fn(),
}));

// Import AFTER mocks are set up
import { checkPreLaunchRequirements } from '@/lib/guardrails/pre-launch-check';
import { prisma } from '@/lib/prisma/client';
import { isTokenValid } from '@/lib/gmail/token-service';

describe('Pre-Launch Check Service - Story 5.2', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: token is valid
        (isTokenValid as Mock).mockResolvedValue(true);
    });

    describe('checkPreLaunchRequirements', () => {
        const workspaceId = 'workspace-123';
        const sequenceId = 'sequence-456';
        const prospectIds = ['prospect-1', 'prospect-2'];

        it('returns canLaunch: true when all checks pass', async () => {
            // Setup: all conditions are met
            (prisma.workspace.findUnique as Mock).mockResolvedValue({
                spfStatus: 'PASS',
                dkimStatus: 'PASS',
                dmarcStatus: 'PASS',
                gmailToken: { id: 'token-123', email: 'owner@company.com' },
            });
            (prisma.sequence.findUnique as Mock).mockResolvedValue({
                status: 'READY',
                name: 'Test Sequence',
            });
            (prisma.prospect.findMany as Mock).mockResolvedValue([
                { id: 'prospect-1', status: 'VERIFIED', email: 'a@test.com' },
                { id: 'prospect-2', status: 'VERIFIED', email: 'b@test.com' },
            ]);

            const result = await checkPreLaunchRequirements(workspaceId, sequenceId, prospectIds);

            expect(result.canLaunch).toBe(true);
            expect(result.issues).toHaveLength(0);
        });

        it('returns ONBOARDING_INCOMPLETE issue when onboarding not complete', async () => {
            (prisma.workspace.findUnique as Mock).mockResolvedValue({
                onboardingComplete: false,
                gmailToken: { id: 'token-123' },
            });
            (prisma.sequence.findUnique as Mock).mockResolvedValue({
                status: 'READY',
                name: 'Test Sequence',
            });
            (prisma.prospect.findMany as Mock).mockResolvedValue([
                { id: 'prospect-1', status: 'VERIFIED', email: 'a@test.com' },
            ]);

            const result = await checkPreLaunchRequirements(workspaceId, sequenceId, ['prospect-1']);

            expect(result.canLaunch).toBe(false);
            expect(result.issues).toContainEqual(
                expect.objectContaining({ code: 'ONBOARDING_INCOMPLETE' })
            );
        });

        it('returns GMAIL_NOT_CONNECTED issue when no Gmail token', async () => {
            (prisma.workspace.findUnique as Mock).mockResolvedValue({
                onboardingComplete: true,
                gmailToken: null,
            });
            (prisma.sequence.findUnique as Mock).mockResolvedValue({
                status: 'READY',
                name: 'Test Sequence',
            });
            (prisma.prospect.findMany as Mock).mockResolvedValue([
                { id: 'prospect-1', status: 'VERIFIED', email: 'a@test.com' },
            ]);

            const result = await checkPreLaunchRequirements(workspaceId, sequenceId, ['prospect-1']);

            expect(result.canLaunch).toBe(false);
            expect(result.issues).toContainEqual(
                expect.objectContaining({ code: 'GMAIL_NOT_CONNECTED' })
            );
        });

        it('returns GMAIL_TOKEN_INVALID issue when token is expired', async () => {
            (prisma.workspace.findUnique as Mock).mockResolvedValue({
                onboardingComplete: true,
                spfStatus: 'PASS',
                dkimStatus: 'PASS',
                dmarcStatus: 'PASS',
                gmailToken: { id: 'token-123', email: 'owner@company.com' },
            });
            (isTokenValid as Mock).mockResolvedValue(false);
            (prisma.sequence.findUnique as Mock).mockResolvedValue({
                status: 'READY',
                name: 'Test Sequence',
            });
            (prisma.prospect.findMany as Mock).mockResolvedValue([
                { id: 'prospect-1', status: 'VERIFIED', email: 'a@test.com' },
            ]);

            const result = await checkPreLaunchRequirements(workspaceId, sequenceId, ['prospect-1']);

            expect(result.canLaunch).toBe(false);
            expect(result.issues).toContainEqual(
                expect.objectContaining({ code: 'GMAIL_TOKEN_INVALID' })
            );
        });

        it('returns SEQUENCE_NOT_READY issue when sequence status is DRAFT', async () => {
            (prisma.workspace.findUnique as Mock).mockResolvedValue({
                onboardingComplete: true,
                gmailToken: { id: 'token-123' },
            });
            (prisma.sequence.findUnique as Mock).mockResolvedValue({
                status: 'DRAFT',
                name: 'Test Sequence',
            });
            (prisma.prospect.findMany as Mock).mockResolvedValue([
                { id: 'prospect-1', status: 'VERIFIED', email: 'a@test.com' },
            ]);

            const result = await checkPreLaunchRequirements(workspaceId, sequenceId, ['prospect-1']);

            expect(result.canLaunch).toBe(false);
            expect(result.issues).toContainEqual(
                expect.objectContaining({ code: 'SEQUENCE_NOT_READY' })
            );
        });

        it('returns UNVERIFIED_PROSPECTS issue when prospects are not verified', async () => {
            (prisma.workspace.findUnique as Mock).mockResolvedValue({
                spfStatus: 'PASS',
                dkimStatus: 'PASS',
                dmarcStatus: 'PASS',
                gmailToken: { id: 'token-123', email: 'owner@company.com' },
            });
            (prisma.sequence.findUnique as Mock).mockResolvedValue({
                status: 'READY',
                name: 'Test Sequence',
            });
            (prisma.prospect.findMany as Mock).mockResolvedValue([
                { id: 'prospect-1', status: 'NOT_VERIFIED', email: 'a@test.com' },
                { id: 'prospect-2', status: 'VERIFIED', email: 'b@test.com' },
            ]);

            const result = await checkPreLaunchRequirements(workspaceId, sequenceId, prospectIds);

            expect(result.canLaunch).toBe(true);
            expect(result.warnings).toContainEqual(
                expect.objectContaining({ code: 'UNVERIFIED_PROSPECTS' })
            );
            expect(result.issues).toHaveLength(0);
        });

        it('returns UNVERIFIED_PROSPECTS issue when no prospects selected', async () => {
            (prisma.workspace.findUnique as Mock).mockResolvedValue({
                onboardingComplete: true,
                gmailToken: { id: 'token-123' },
            });
            (prisma.sequence.findUnique as Mock).mockResolvedValue({
                status: 'READY',
                name: 'Test Sequence',
            });

            const result = await checkPreLaunchRequirements(workspaceId, sequenceId, []);

            expect(result.canLaunch).toBe(false);
            expect(result.issues).toContainEqual(
                expect.objectContaining({ code: 'NO_PROSPECTS_SELECTED' })
            );
        });

        it('returns multiple issues when multiple checks fail', async () => {
            (prisma.workspace.findUnique as Mock).mockResolvedValue({
                onboardingComplete: false,
                gmailToken: null,
            });
            (prisma.sequence.findUnique as Mock).mockResolvedValue({
                status: 'DRAFT',
                name: 'Test Sequence',
            });
            (prisma.prospect.findMany as Mock).mockResolvedValue([]);

            const result = await checkPreLaunchRequirements(workspaceId, sequenceId, prospectIds);

            expect(result.canLaunch).toBe(false);
            // Should have at least 3 issues: onboarding incomplete, gmail not connected, prospects
            expect(result.issues.length).toBeGreaterThanOrEqual(3);
        });
    });
});
