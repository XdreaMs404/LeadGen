/**
 * Unit Tests: Prospect Control
 * Story 5.7: Individual Lead Control within Campaign
 * 
 * Tests state transitions, error messages, and validation logic.
 */

import { describe, it, expect } from 'vitest';
import {
    isValidProspectTransition,
    getProspectTransitionError,
    getProspectTargetStatus,
    VALID_PROSPECT_TRANSITIONS,
} from '@/types/prospect-control';
import { EnrollmentStatus } from '@prisma/client';

describe('prospect-control types', () => {
    describe('VALID_PROSPECT_TRANSITIONS', () => {
        it('should allow pause and stop from ENROLLED', () => {
            expect(VALID_PROSPECT_TRANSITIONS.ENROLLED).toEqual(['pause', 'stop']);
        });

        it('should allow resume and stop from PAUSED', () => {
            expect(VALID_PROSPECT_TRANSITIONS.PAUSED).toEqual(['resume', 'stop']);
        });

        it('should not allow any actions from terminal states', () => {
            expect(VALID_PROSPECT_TRANSITIONS.COMPLETED).toEqual([]);
            expect(VALID_PROSPECT_TRANSITIONS.STOPPED).toEqual([]);
            expect(VALID_PROSPECT_TRANSITIONS.REPLIED).toEqual([]);
        });
    });

    describe('isValidProspectTransition', () => {
        it('should return true for valid transitions', () => {
            expect(isValidProspectTransition(EnrollmentStatus.ENROLLED, 'pause')).toBe(true);
            expect(isValidProspectTransition(EnrollmentStatus.ENROLLED, 'stop')).toBe(true);
            expect(isValidProspectTransition(EnrollmentStatus.PAUSED, 'resume')).toBe(true);
            expect(isValidProspectTransition(EnrollmentStatus.PAUSED, 'stop')).toBe(true);
        });

        it('should return false for invalid transitions', () => {
            // Cannot resume if not paused
            expect(isValidProspectTransition(EnrollmentStatus.ENROLLED, 'resume')).toBe(false);
            // Cannot pause if already paused
            expect(isValidProspectTransition(EnrollmentStatus.PAUSED, 'pause')).toBe(false);
            // Cannot do anything from terminal states
            expect(isValidProspectTransition(EnrollmentStatus.STOPPED, 'resume')).toBe(false);
            expect(isValidProspectTransition(EnrollmentStatus.STOPPED, 'pause')).toBe(false);
            expect(isValidProspectTransition(EnrollmentStatus.COMPLETED, 'stop')).toBe(false);
            expect(isValidProspectTransition(EnrollmentStatus.REPLIED, 'stop')).toBe(false);
        });
    });

    describe('getProspectTargetStatus', () => {
        it('should return correct target status for each action', () => {
            expect(getProspectTargetStatus('pause')).toBe(EnrollmentStatus.PAUSED);
            expect(getProspectTargetStatus('resume')).toBe(EnrollmentStatus.ENROLLED);
            expect(getProspectTargetStatus('stop')).toBe(EnrollmentStatus.STOPPED);
        });
    });

    describe('getProspectTransitionError', () => {
        it('should return French error message for invalid transitions', () => {
            const error = getProspectTransitionError(EnrollmentStatus.STOPPED, 'resume');
            expect(error).toContain('Impossible de');
            expect(error).toContain('reprendre');
            expect(error).toContain('arrêté');
        });

        it('should include action and status in error message', () => {
            const pauseError = getProspectTransitionError(EnrollmentStatus.PAUSED, 'pause');
            expect(pauseError).toContain('mettre en pause');
            expect(pauseError).toContain('en pause');

            const stopError = getProspectTransitionError(EnrollmentStatus.COMPLETED, 'stop');
            expect(stopError).toContain('arrêter');
            expect(stopError).toContain('terminé');
        });
    });
});
