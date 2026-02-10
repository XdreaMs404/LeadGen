/**
 * Campaign Control Unit Tests
 * Story 5.6: Campaign Control (Pause/Resume/Stop Global)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    CampaignStatus,
    isValidTransition,
    getTargetStatus,
    getTransitionError,
    VALID_TRANSITIONS,
} from '@/types/campaign-control';

describe('Campaign Control - State Transitions', () => {
    describe('VALID_TRANSITIONS', () => {
        it('should allow pause and stop from RUNNING', () => {
            expect(VALID_TRANSITIONS.RUNNING).toEqual(['pause', 'stop']);
        });

        it('should allow resume and stop from PAUSED', () => {
            expect(VALID_TRANSITIONS.PAUSED).toEqual(['resume', 'stop']);
        });

        it('should not allow any actions from DRAFT', () => {
            expect(VALID_TRANSITIONS.DRAFT).toEqual([]);
        });

        it('should not allow any actions from STOPPED', () => {
            expect(VALID_TRANSITIONS.STOPPED).toEqual([]);
        });

        it('should not allow any actions from COMPLETED', () => {
            expect(VALID_TRANSITIONS.COMPLETED).toEqual([]);
        });
    });

    describe('isValidTransition', () => {
        // RUNNING transitions
        it('should allow pause from RUNNING', () => {
            expect(isValidTransition('RUNNING' as CampaignStatus, 'pause')).toBe(true);
        });

        it('should allow stop from RUNNING', () => {
            expect(isValidTransition('RUNNING' as CampaignStatus, 'stop')).toBe(true);
        });

        it('should not allow resume from RUNNING', () => {
            expect(isValidTransition('RUNNING' as CampaignStatus, 'resume')).toBe(false);
        });

        // PAUSED transitions
        it('should allow resume from PAUSED', () => {
            expect(isValidTransition('PAUSED' as CampaignStatus, 'resume')).toBe(true);
        });

        it('should allow stop from PAUSED', () => {
            expect(isValidTransition('PAUSED' as CampaignStatus, 'stop')).toBe(true);
        });

        it('should not allow pause from PAUSED', () => {
            expect(isValidTransition('PAUSED' as CampaignStatus, 'pause')).toBe(false);
        });

        // DRAFT transitions
        it('should not allow any action from DRAFT', () => {
            expect(isValidTransition('DRAFT' as CampaignStatus, 'pause')).toBe(false);
            expect(isValidTransition('DRAFT' as CampaignStatus, 'resume')).toBe(false);
            expect(isValidTransition('DRAFT' as CampaignStatus, 'stop')).toBe(false);
        });

        // STOPPED transitions
        it('should not allow any action from STOPPED', () => {
            expect(isValidTransition('STOPPED' as CampaignStatus, 'pause')).toBe(false);
            expect(isValidTransition('STOPPED' as CampaignStatus, 'resume')).toBe(false);
            expect(isValidTransition('STOPPED' as CampaignStatus, 'stop')).toBe(false);
        });

        // COMPLETED transitions
        it('should not allow any action from COMPLETED', () => {
            expect(isValidTransition('COMPLETED' as CampaignStatus, 'pause')).toBe(false);
            expect(isValidTransition('COMPLETED' as CampaignStatus, 'resume')).toBe(false);
            expect(isValidTransition('COMPLETED' as CampaignStatus, 'stop')).toBe(false);
        });
    });

    describe('getTargetStatus', () => {
        it('should return PAUSED for pause action', () => {
            expect(getTargetStatus('pause')).toBe('PAUSED');
        });

        it('should return RUNNING for resume action', () => {
            expect(getTargetStatus('resume')).toBe('RUNNING');
        });

        it('should return STOPPED for stop action', () => {
            expect(getTargetStatus('stop')).toBe('STOPPED');
        });
    });

    describe('getTransitionError', () => {
        it('should return appropriate error for pause on DRAFT', () => {
            const error = getTransitionError('DRAFT' as CampaignStatus, 'pause');
            expect(error).toContain('mettre en pause');
            expect(error).toContain('brouillon');
        });

        it('should return appropriate error for resume on RUNNING', () => {
            const error = getTransitionError('RUNNING' as CampaignStatus, 'resume');
            expect(error).toContain('reprendre');
            expect(error).toContain('en cours');
        });

        it('should return appropriate error for stop on STOPPED', () => {
            const error = getTransitionError('STOPPED' as CampaignStatus, 'stop');
            expect(error).toContain('arrêter');
            expect(error).toContain('arrêtée');
        });

        it('should return appropriate error for pause on COMPLETED', () => {
            const error = getTransitionError('COMPLETED' as CampaignStatus, 'pause');
            expect(error).toContain('mettre en pause');
            expect(error).toContain('terminée');
        });
    });
});
