import { describe, it, expect } from 'vitest';
import { isOnboardingComplete, calculateProgress } from '@/lib/onboarding/onboarding-service';

describe('onboarding-service', () => {
    describe('isOnboardingComplete', () => {
        it('returns false when Gmail is not connected', () => {
            const workspace = {
                gmailToken: null,
                spfStatus: 'PASS',
                dkimStatus: 'PASS',
                dmarcStatus: 'PASS',
            };
            expect(isOnboardingComplete(workspace)).toBe(false);
        });

        it('returns false when SPF is NOT_STARTED', () => {
            const workspace = {
                gmailToken: { id: 'token-123' },
                spfStatus: 'NOT_STARTED',
                dkimStatus: 'PASS',
                dmarcStatus: 'PASS',
            };
            expect(isOnboardingComplete(workspace)).toBe(false);
        });

        it('returns false when DKIM is FAIL', () => {
            const workspace = {
                gmailToken: { id: 'token-123' },
                spfStatus: 'PASS',
                dkimStatus: 'FAIL',
                dmarcStatus: 'PASS',
            };
            expect(isOnboardingComplete(workspace)).toBe(false);
        });

        it('returns false when DMARC is UNKNOWN', () => {
            const workspace = {
                gmailToken: { id: 'token-123' },
                spfStatus: 'PASS',
                dkimStatus: 'PASS',
                dmarcStatus: 'UNKNOWN',
            };
            expect(isOnboardingComplete(workspace)).toBe(false);
        });

        it('returns true when all conditions are met with PASS', () => {
            const workspace = {
                gmailToken: { id: 'token-123' },
                spfStatus: 'PASS',
                dkimStatus: 'PASS',
                dmarcStatus: 'PASS',
            };
            expect(isOnboardingComplete(workspace)).toBe(true);
        });

        it('returns true when DNS has MANUAL_OVERRIDE', () => {
            const workspace = {
                gmailToken: { id: 'token-123' },
                spfStatus: 'MANUAL_OVERRIDE',
                dkimStatus: 'PASS',
                dmarcStatus: 'MANUAL_OVERRIDE',
            };
            expect(isOnboardingComplete(workspace)).toBe(true);
        });

        it('returns true with mixed PASS and MANUAL_OVERRIDE', () => {
            const workspace = {
                gmailToken: { id: 'token-123' },
                spfStatus: 'PASS',
                dkimStatus: 'MANUAL_OVERRIDE',
                dmarcStatus: 'PASS',
            };
            expect(isOnboardingComplete(workspace)).toBe(true);
        });
    });

    describe('calculateProgress', () => {
        it('returns 0 when nothing is complete', () => {
            const workspace = {
                gmailToken: null,
                spfStatus: 'NOT_STARTED',
                dkimStatus: 'NOT_STARTED',
                dmarcStatus: 'NOT_STARTED',
            };
            expect(calculateProgress(workspace)).toBe(0);
        });

        it('returns 25 when only Gmail is connected', () => {
            const workspace = {
                gmailToken: { id: 'token-123' },
                spfStatus: 'NOT_STARTED',
                dkimStatus: 'NOT_STARTED',
                dmarcStatus: 'NOT_STARTED',
            };
            expect(calculateProgress(workspace)).toBe(25);
        });

        it('returns 50 when Gmail + SPF are complete', () => {
            const workspace = {
                gmailToken: { id: 'token-123' },
                spfStatus: 'PASS',
                dkimStatus: 'NOT_STARTED',
                dmarcStatus: 'NOT_STARTED',
            };
            expect(calculateProgress(workspace)).toBe(50);
        });

        it('returns 75 when Gmail + SPF + DKIM are complete', () => {
            const workspace = {
                gmailToken: { id: 'token-123' },
                spfStatus: 'PASS',
                dkimStatus: 'PASS',
                dmarcStatus: 'FAIL',
            };
            expect(calculateProgress(workspace)).toBe(75);
        });

        it('returns 100 when all steps are complete', () => {
            const workspace = {
                gmailToken: { id: 'token-123' },
                spfStatus: 'PASS',
                dkimStatus: 'PASS',
                dmarcStatus: 'PASS',
            };
            expect(calculateProgress(workspace)).toBe(100);
        });

        it('counts MANUAL_OVERRIDE as complete', () => {
            const workspace = {
                gmailToken: { id: 'token-123' },
                spfStatus: 'MANUAL_OVERRIDE',
                dkimStatus: 'MANUAL_OVERRIDE',
                dmarcStatus: 'MANUAL_OVERRIDE',
            };
            expect(calculateProgress(workspace)).toBe(100);
        });

        it('returns 50 with 2 completed (Gmail + one MANUAL_OVERRIDE)', () => {
            const workspace = {
                gmailToken: { id: 'token-123' },
                spfStatus: 'MANUAL_OVERRIDE',
                dkimStatus: 'FAIL',
                dmarcStatus: 'NOT_STARTED',
            };
            expect(calculateProgress(workspace)).toBe(50);
        });
    });
});
