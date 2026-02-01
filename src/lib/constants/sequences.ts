// Story 4.5 - Sample Prospects for Preview
// Used for Copilot email preview when no real prospects are linked
import type { PreviewProspect } from '@/lib/sequences/preview-renderer';

export const MAX_STEPS_PER_SEQUENCE = 3;

// Story 4.2 - Delay Constants
export const ALLOWED_DELAY_DAYS = [1, 2, 3, 5, 7, 14] as const;
export const DEFAULT_DELAY_DAYS = 3;

// Story 5.2 - Sequence Status Labels (French)
export const SEQUENCE_STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Brouillon',
    READY: 'Prête',
    ARCHIVED: 'Archivée',
};

export const DELAY_LABELS: Record<number, string> = {
    0: 'Immédiat',
    1: '1 jour',
    2: '2 jours',
    3: '3 jours',
    5: '5 jours',
    7: '7 jours',
    14: '14 jours',
};

// Story 4.5 - Sample Prospects for Preview
export const SAMPLE_PROSPECTS: PreviewProspect[] = [
    {
        firstName: 'Sophie',
        lastName: 'Martin',
        company: 'TechCorp France',
        title: 'Directrice Marketing',
        email: 'sophie.martin@techcorp.fr',
    },
    {
        firstName: 'Marc',
        lastName: 'Dupont',
        company: 'InnovaStart',
        title: 'CEO & Fondateur',
        email: 'marc.dupont@innovastart.io',
    },
    {
        firstName: 'Émilie',
        lastName: 'Bernard',
        company: 'DataFlow Solutions',
        title: 'Head of Sales',
        email: 'e.bernard@dataflow-solutions.com',
    },
    {
        firstName: 'Thomas',
        lastName: 'Leroy',
        company: 'CloudNine SAS',
        title: 'VP Growth',
        email: 'thomas.leroy@cloudnine.eu',
    },
    {
        firstName: 'Claire',
        lastName: 'Moreau',
        company: 'FinTech Plus',
        title: 'Responsable Partenariats',
        email: 'claire.moreau@fintechplus.fr',
    },
];

// Story 4.6 - Spam Risk Assessment Constants

/**
 * Spam risk scoring thresholds
 * LOW: score <30
 * MEDIUM: score 30-60
 * HIGH: score >60
 */
export const SPAM_THRESHOLDS = {
    LOW: 30,
    MEDIUM: 60,
} as const;

/**
 * Risky words that may trigger spam filters
 * Includes both French and English terms across different categories:
 * - Urgency: Words creating false urgency
 * - Money/Promise: Words making financial claims
 * - Pressure/Scam: Words commonly used in scam emails
 */
export const SPAM_RISKY_WORDS: string[] = [
    // Urgency - French
    'urgent',
    'vite',
    'maintenant',
    'dernière chance',
    'limité',
    'offre exclusive',
    'dernière opportunité',
    'temps limité',
    // Urgency - English
    'act now',
    'limited time',
    'hurry',
    "don't miss",
    'last chance',
    'expire',
    'expires',
    'immediately',
    // Money/Promise - French
    'gratuit',
    '100%',
    'garanti',
    'remboursé',
    'gagner',
    'cash',
    'argent facile',
    'sans risque',
    'sans engagement',
    // Money/Promise - English
    'free',
    'guarantee',
    'guaranteed',
    'winner',
    'prize',
    'money back',
    'no risk',
    'no obligation',
    // Pressure/Scam signals - French
    'obligatoire',
    'vous avez été sélectionné',
    'félicitations',
    'cliquez ici immédiatement',
    'offre réservée',
    'exclusif',
    // Pressure/Scam signals - English
    'congratulations',
    "you've been selected",
    'click here now',
    'exclusive offer',
    'selected',
    'act immediately',
];
