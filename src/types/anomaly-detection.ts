/**
 * Anomaly Detection Types
 * Story 5.8: Anomaly Detection & Auto-Pause (Deliverability)
 */

import { AutoPauseReason, CampaignStatus } from '@prisma/client';
import { z } from 'zod';

// Re-export for convenience
export { AutoPauseReason };

/**
 * Volume tiers for threshold calculation
 * Different thresholds apply based on email volume
 */
export type VolumeTier = 'VERY_LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH';

/**
 * Threshold configuration for a specific volume tier
 */
export interface ThresholdConfig {
    minEmails: number;
    maxEmails: number;
    warningRatePercent: number;
    warningMinCount: number;
    pauseRatePercent: number;
    pauseMinCount: number;
}

/**
 * Volume-based threshold configurations for bounce rate
 * Based on AC1-AC8
 */
export const BOUNCE_THRESHOLDS: Record<VolumeTier, ThresholdConfig> = {
    VERY_LOW: {
        minEmails: 5,
        maxEmails: 20,
        warningRatePercent: 0, // Warning based on count only
        warningMinCount: 2,
        pauseRatePercent: 40,
        pauseMinCount: 3,
    },
    LOW_MEDIUM: {
        minEmails: 20,
        maxEmails: 100,
        warningRatePercent: 5,
        warningMinCount: 2,
        pauseRatePercent: 8,
        pauseMinCount: 4,
    },
    MEDIUM: {
        minEmails: 100,
        maxEmails: 500,
        warningRatePercent: 3,
        warningMinCount: 3,
        pauseRatePercent: 5,
        pauseMinCount: 10,
    },
    HIGH: {
        minEmails: 500,
        maxEmails: Infinity,
        warningRatePercent: 2.5,
        warningMinCount: 10,
        pauseRatePercent: 4,
        pauseMinCount: 25,
    },
};

/**
 * Volume-based threshold configurations for unsubscribe rate
 * Based on AC9-AC16
 */
export const UNSUBSCRIBE_THRESHOLDS: Record<VolumeTier, ThresholdConfig> = {
    VERY_LOW: {
        minEmails: 5,
        maxEmails: 20,
        warningRatePercent: 0, // Warning based on count only
        warningMinCount: 2,
        pauseRatePercent: 20,
        pauseMinCount: 3,
    },
    LOW_MEDIUM: {
        minEmails: 20,
        maxEmails: 100,
        warningRatePercent: 1,
        warningMinCount: 4,
        pauseRatePercent: 2,
        pauseMinCount: 7,
    },
    MEDIUM: {
        minEmails: 100,
        maxEmails: 500,
        warningRatePercent: 0.8,
        warningMinCount: 10,
        pauseRatePercent: 1.5,
        pauseMinCount: 25,
    },
    HIGH: {
        minEmails: 500,
        maxEmails: Infinity,
        warningRatePercent: 0.7,
        warningMinCount: 30,
        pauseRatePercent: 1.5,
        pauseMinCount: 50,
    },
};

/**
 * Rolling window in hours for email volume calculation (24h)
 */
export const ROLLING_WINDOW_HOURS = 24;

/**
 * Notification severity levels
 */
export type NotificationSeverity = 'WARNING' | 'ERROR';

/**
 * Anomaly metrics for a campaign
 */
export interface AnomalyMetrics {
    campaignId: string;
    campaignName: string;
    totalSent: number;
    volumeTier: VolumeTier;
    bounceCount: number;
    bounceRate: number; // Percentage 0-100
    unsubscribeCount: number;
    unsubscribeRate: number; // Percentage 0-100
    windowHours: number;
}

/**
 * Result of anomaly detection for a single campaign
 */
export interface AnomalyResult {
    campaignId: string;
    workspaceId: string;
    campaignName: string;
    metrics: AnomalyMetrics;
    shouldPause: boolean;
    shouldWarn: boolean;
    reason: AutoPauseReason | null;
    severity: NotificationSeverity | null;
    message: string | null;
}

/**
 * Result of auto-pausing a campaign
 */
export interface AutoPausedCampaign {
    campaignId: string;
    campaignName: string;
    reason: AutoPauseReason;
    metrics: AnomalyMetrics;
    pausedAt: Date;
}

/**
 * Notification record for anomaly events
 */
export interface AnomalyNotification {
    id: string;
    campaignId: string;
    workspaceId: string;
    severity: NotificationSeverity;
    reason: AutoPauseReason;
    metrics: AnomalyMetrics;
    acknowledged: boolean;
    createdAt: Date;
}

/**
 * Zod schema for resume with acknowledgment
 */
export const ResumeWithAcknowledgmentSchema = z.object({
    action: z.literal('resume'),
    acknowledgeRisk: z.boolean().optional(),
});

/**
 * Messages for auto-pause reasons (French UI)
 */
export const AUTO_PAUSE_MESSAGES: Record<AutoPauseReason, { title: string; description: string; steps: string[] }> = {
    HIGH_BOUNCE_RATE: {
        title: 'Taux de bounce élevé',
        description: 'Trop d\'emails rebondissent vers des adresses invalides. Cela peut nuire à votre réputation d\'expéditeur.',
        steps: [
            'Vérifiez la qualité de votre liste de contacts',
            'Supprimez les adresses invalides ou inactives',
            'Revérifiez la configuration DNS de votre domaine',
            'Contactez le support si le problème persiste',
        ],
    },
    HIGH_UNSUBSCRIBE_RATE: {
        title: 'Taux de désabonnement élevé',
        description: 'Trop de destinataires se désabonnent. Cela peut indiquer un problème avec votre contenu ou ciblage.',
        steps: [
            'Revoyez le contenu de vos emails',
            'Vérifiez que votre ciblage est pertinent',
            'Espacez davantage vos envois',
            'Personnalisez mieux vos messages',
        ],
    },
    HIGH_COMPLAINT_RATE: {
        title: 'Taux de plaintes élevé',
        description: 'Trop de destinataires signalent vos emails comme spam. Cela peut gravement nuire à votre délivrabilité.',
        steps: [
            'Vérifiez que vous avez l\'autorisation d\'envoyer',
            'Améliorez la qualité de votre contenu',
            'Ajoutez un lien de désabonnement visible',
            'Réduisez la fréquence d\'envoi',
        ],
    },
};
