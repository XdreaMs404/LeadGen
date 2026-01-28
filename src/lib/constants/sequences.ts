export const MAX_STEPS_PER_SEQUENCE = 3;

// Story 4.2 - Delay Constants
export const ALLOWED_DELAY_DAYS = [1, 2, 3, 5, 7, 14] as const;
export const DEFAULT_DELAY_DAYS = 3;
export const DELAY_LABELS: Record<number, string> = {
    0: 'Immédiat',
    1: '1 jour',
    2: '2 jours',
    3: '3 jours',
    5: '5 jours',
    7: '7 jours',
    14: '14 jours',
};
