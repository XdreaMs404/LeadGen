import { describe, it, expect } from 'vitest';
import { CampaignStatus, EnrollmentStatus } from '@prisma/client';
import {
    CAMPAIGN_STATUS_LABELS,
    ENROLLMENT_STATUS_LABELS,
    ALLOWED_CAMPAIGN_STATUS_TRANSITIONS,
    ALLOWED_ENROLLMENT_STATUS_TRANSITIONS,
    CAMPAIGN_STATUS_COLORS,
    ENROLLMENT_STATUS_COLORS,
} from '@/lib/constants/campaigns';

describe('Campaign Status Enum', () => {
    it('should have all expected status values', () => {
        const expectedStatuses = ['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'STOPPED'];
        const actualStatuses = Object.values(CampaignStatus);

        expect(actualStatuses).toEqual(expect.arrayContaining(expectedStatuses));
        expect(actualStatuses.length).toBe(expectedStatuses.length);
    });

    it('should have French labels for all statuses', () => {
        Object.values(CampaignStatus).forEach((status) => {
            expect(CAMPAIGN_STATUS_LABELS[status]).toBeDefined();
            expect(typeof CAMPAIGN_STATUS_LABELS[status]).toBe('string');
        });
    });

    it('should have color variants for all statuses', () => {
        Object.values(CampaignStatus).forEach((status) => {
            expect(CAMPAIGN_STATUS_COLORS[status]).toBeDefined();
            expect(['default', 'secondary', 'destructive', 'outline']).toContain(
                CAMPAIGN_STATUS_COLORS[status]
            );
        });
    });
});

describe('Enrollment Status Enum', () => {
    it('should have all expected status values', () => {
        const expectedStatuses = ['ENROLLED', 'PAUSED', 'COMPLETED', 'STOPPED', 'REPLIED'];
        const actualStatuses = Object.values(EnrollmentStatus);

        expect(actualStatuses).toEqual(expect.arrayContaining(expectedStatuses));
        expect(actualStatuses.length).toBe(expectedStatuses.length);
    });

    it('should have French labels for all enrollment statuses', () => {
        Object.values(EnrollmentStatus).forEach((status) => {
            expect(ENROLLMENT_STATUS_LABELS[status]).toBeDefined();
            expect(typeof ENROLLMENT_STATUS_LABELS[status]).toBe('string');
        });
    });

    it('should have color variants for all enrollment statuses', () => {
        Object.values(EnrollmentStatus).forEach((status) => {
            expect(ENROLLMENT_STATUS_COLORS[status]).toBeDefined();
            expect(['default', 'secondary', 'destructive', 'outline']).toContain(
                ENROLLMENT_STATUS_COLORS[status]
            );
        });
    });
});

describe('Campaign Status Transitions', () => {
    it('should allow DRAFT to transition to RUNNING', () => {
        expect(ALLOWED_CAMPAIGN_STATUS_TRANSITIONS[CampaignStatus.DRAFT]).toContain(
            CampaignStatus.RUNNING
        );
    });

    it('should allow RUNNING to transition to PAUSED, STOPPED, or COMPLETED', () => {
        const runningTransitions = ALLOWED_CAMPAIGN_STATUS_TRANSITIONS[CampaignStatus.RUNNING];
        expect(runningTransitions).toContain(CampaignStatus.PAUSED);
        expect(runningTransitions).toContain(CampaignStatus.STOPPED);
        expect(runningTransitions).toContain(CampaignStatus.COMPLETED);
    });

    it('should allow PAUSED to transition to RUNNING or STOPPED', () => {
        const pausedTransitions = ALLOWED_CAMPAIGN_STATUS_TRANSITIONS[CampaignStatus.PAUSED];
        expect(pausedTransitions).toContain(CampaignStatus.RUNNING);
        expect(pausedTransitions).toContain(CampaignStatus.STOPPED);
    });

    it('should not allow COMPLETED to transition anywhere (terminal state)', () => {
        expect(ALLOWED_CAMPAIGN_STATUS_TRANSITIONS[CampaignStatus.COMPLETED]).toHaveLength(0);
    });

    it('should not allow STOPPED to transition anywhere (terminal state)', () => {
        expect(ALLOWED_CAMPAIGN_STATUS_TRANSITIONS[CampaignStatus.STOPPED]).toHaveLength(0);
    });
});

describe('Enrollment Status Transitions', () => {
    it('should allow ENROLLED to transition to multiple states', () => {
        const enrolledTransitions = ALLOWED_ENROLLMENT_STATUS_TRANSITIONS[EnrollmentStatus.ENROLLED];
        expect(enrolledTransitions).toContain(EnrollmentStatus.PAUSED);
        expect(enrolledTransitions).toContain(EnrollmentStatus.COMPLETED);
        expect(enrolledTransitions).toContain(EnrollmentStatus.STOPPED);
        expect(enrolledTransitions).toContain(EnrollmentStatus.REPLIED);
    });

    it('should allow REPLIED to transition to COMPLETED or STOPPED', () => {
        const repliedTransitions = ALLOWED_ENROLLMENT_STATUS_TRANSITIONS[EnrollmentStatus.REPLIED];
        expect(repliedTransitions).toContain(EnrollmentStatus.COMPLETED);
        expect(repliedTransitions).toContain(EnrollmentStatus.STOPPED);
    });

    it('should not allow COMPLETED to transition anywhere (terminal state)', () => {
        expect(ALLOWED_ENROLLMENT_STATUS_TRANSITIONS[EnrollmentStatus.COMPLETED]).toHaveLength(0);
    });

    it('should not allow STOPPED to transition anywhere (terminal state)', () => {
        expect(ALLOWED_ENROLLMENT_STATUS_TRANSITIONS[EnrollmentStatus.STOPPED]).toHaveLength(0);
    });
});

describe('Campaign French Labels', () => {
    it('should have correct French labels for campaign statuses', () => {
        expect(CAMPAIGN_STATUS_LABELS[CampaignStatus.DRAFT]).toBe('Brouillon');
        expect(CAMPAIGN_STATUS_LABELS[CampaignStatus.RUNNING]).toBe('En cours');
        expect(CAMPAIGN_STATUS_LABELS[CampaignStatus.PAUSED]).toBe('En pause');
        expect(CAMPAIGN_STATUS_LABELS[CampaignStatus.COMPLETED]).toBe('Terminée');
        expect(CAMPAIGN_STATUS_LABELS[CampaignStatus.STOPPED]).toBe('Arrêtée');
    });

    it('should have correct French labels for enrollment statuses', () => {
        expect(ENROLLMENT_STATUS_LABELS[EnrollmentStatus.ENROLLED]).toBe('Inscrit');
        expect(ENROLLMENT_STATUS_LABELS[EnrollmentStatus.PAUSED]).toBe('En pause');
        expect(ENROLLMENT_STATUS_LABELS[EnrollmentStatus.COMPLETED]).toBe('Terminé');
        expect(ENROLLMENT_STATUS_LABELS[EnrollmentStatus.STOPPED]).toBe('Arrêté');
        expect(ENROLLMENT_STATUS_LABELS[EnrollmentStatus.REPLIED]).toBe('Répondu');
    });
});
