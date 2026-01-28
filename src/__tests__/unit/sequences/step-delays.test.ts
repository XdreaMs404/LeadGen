import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ALLOWED_DELAY_DAYS, DEFAULT_DELAY_DAYS, DELAY_LABELS } from '@/lib/constants/sequences';

/**
 * Story 4.2 - Task 8: Unit tests for delay constants and logic
 * Tests delay validation, default values, and label mappings
 */
describe('Delay Constants (Story 4.2)', () => {
    describe('ALLOWED_DELAY_DAYS', () => {
        it('should contain expected delay values', () => {
            expect(ALLOWED_DELAY_DAYS).toEqual([1, 2, 3, 5, 7, 14]);
        });

        it('should be a readonly array', () => {
            // Type check - ALLOWED_DELAY_DAYS should be readonly
            const arr: readonly number[] = ALLOWED_DELAY_DAYS;
            expect(arr).toBe(ALLOWED_DELAY_DAYS);
        });

        it('should not include 0 (first step has no delay)', () => {
            expect(ALLOWED_DELAY_DAYS.includes(0 as typeof ALLOWED_DELAY_DAYS[number])).toBe(false);
        });

        it('should not include invalid values like 4, 6, 10', () => {
            expect((ALLOWED_DELAY_DAYS as readonly number[]).includes(4)).toBe(false);
            expect((ALLOWED_DELAY_DAYS as readonly number[]).includes(6)).toBe(false);
            expect((ALLOWED_DELAY_DAYS as readonly number[]).includes(10)).toBe(false);
        });
    });

    describe('DEFAULT_DELAY_DAYS', () => {
        it('should be 3 days', () => {
            expect(DEFAULT_DELAY_DAYS).toBe(3);
        });

        it('should be in ALLOWED_DELAY_DAYS', () => {
            expect((ALLOWED_DELAY_DAYS as readonly number[]).includes(DEFAULT_DELAY_DAYS)).toBe(true);
        });
    });

    describe('DELAY_LABELS', () => {
        it('should have labels for all allowed delay values', () => {
            for (const days of ALLOWED_DELAY_DAYS) {
                expect(DELAY_LABELS[days]).toBeDefined();
            }
        });

        it('should have a label for 0 (Immédiat)', () => {
            expect(DELAY_LABELS[0]).toBe('Immédiat');
        });

        it('should have correct French labels', () => {
            expect(DELAY_LABELS[1]).toBe('1 jour');
            expect(DELAY_LABELS[2]).toBe('2 jours');
            expect(DELAY_LABELS[3]).toBe('3 jours');
            expect(DELAY_LABELS[5]).toBe('5 jours');
            expect(DELAY_LABELS[7]).toBe('7 jours');
            expect(DELAY_LABELS[14]).toBe('14 jours');
        });

        it('should use singular form for 1 jour', () => {
            expect(DELAY_LABELS[1]).not.toContain('jours');
            expect(DELAY_LABELS[1]).toContain('jour');
        });

        it('should use plural form for values > 1', () => {
            for (const days of ALLOWED_DELAY_DAYS.filter(d => d > 1)) {
                expect(DELAY_LABELS[days]).toContain('jours');
            }
        });
    });
});

describe('Delay Validation Logic (Story 4.2 - AC2)', () => {
    const isValidDelay = (value: number): boolean => {
        return value === 0 || (ALLOWED_DELAY_DAYS as readonly number[]).includes(value);
    };

    it('should accept 0 as valid (for first step)', () => {
        expect(isValidDelay(0)).toBe(true);
    });

    it('should accept all ALLOWED_DELAY_DAYS values', () => {
        for (const days of ALLOWED_DELAY_DAYS) {
            expect(isValidDelay(days)).toBe(true);
        }
    });

    it('should reject negative values', () => {
        expect(isValidDelay(-1)).toBe(false);
        expect(isValidDelay(-3)).toBe(false);
    });

    it('should reject values not in allowed list', () => {
        expect(isValidDelay(4)).toBe(false);
        expect(isValidDelay(6)).toBe(false);
        expect(isValidDelay(8)).toBe(false);
        expect(isValidDelay(10)).toBe(false);
        expect(isValidDelay(21)).toBe(false);
    });
});

describe('Timeline Calculation Logic (Story 4.2 - AC4, AC5)', () => {
    interface MockStep {
        order: number;
        delayDays: number;
    }

    const calculateTotalDuration = (steps: MockStep[]): number => {
        const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
        return sortedSteps.reduce((sum, step, i) =>
            i === 0 ? 0 : sum + step.delayDays, 0
        );
    };

    it('should return 0 for a single step', () => {
        const steps: MockStep[] = [{ order: 1, delayDays: 0 }];
        expect(calculateTotalDuration(steps)).toBe(0);
    });

    it('should calculate correct total for two steps', () => {
        const steps: MockStep[] = [
            { order: 1, delayDays: 0 },
            { order: 2, delayDays: 3 },
        ];
        expect(calculateTotalDuration(steps)).toBe(3);
    });

    it('should calculate correct total for three steps (AC4 example)', () => {
        // AC4: step 2 has delay 3 days, step 3 has delay 5 days = 8 days total
        const steps: MockStep[] = [
            { order: 1, delayDays: 0 },
            { order: 2, delayDays: 3 },
            { order: 3, delayDays: 5 },
        ];
        expect(calculateTotalDuration(steps)).toBe(8);
    });

    it('should handle unsorted steps correctly', () => {
        const steps: MockStep[] = [
            { order: 3, delayDays: 5 },
            { order: 1, delayDays: 0 },
            { order: 2, delayDays: 3 },
        ];
        expect(calculateTotalDuration(steps)).toBe(8);
    });

    it('should only count delays from steps after the first', () => {
        // First step's delay should be 0 and ignored in calculation
        const steps: MockStep[] = [
            { order: 1, delayDays: 0 }, // This is always 0
            { order: 2, delayDays: 7 },
        ];
        expect(calculateTotalDuration(steps)).toBe(7);
    });
});

describe('Reorder Delay Preservation Logic (Story 4.2 - AC3)', () => {
    const calculateDelayAfterReorder = (
        stepId: string,
        oldOrder: number,
        newOrder: number,
        currentDelay: number
    ): number => {
        const isFirstPosition = newOrder === 1;
        const wasFirstPosition = oldOrder === 1;

        if (isFirstPosition) {
            // Step moving TO first position → delay must be 0
            return 0;
        } else if (wasFirstPosition && !isFirstPosition) {
            // Step moving FROM first position → set default delay
            return DEFAULT_DELAY_DAYS;
        }
        // Otherwise, keep existing delay
        return currentDelay;
    };

    it('should set delay to 0 when step moves to first position', () => {
        expect(calculateDelayAfterReorder('step-2', 2, 1, 3)).toBe(0);
        expect(calculateDelayAfterReorder('step-3', 3, 1, 5)).toBe(0);
    });

    it('should set default delay when step moves from first position', () => {
        expect(calculateDelayAfterReorder('step-1', 1, 2, 0)).toBe(DEFAULT_DELAY_DAYS);
        expect(calculateDelayAfterReorder('step-1', 1, 3, 0)).toBe(DEFAULT_DELAY_DAYS);
    });

    it('should preserve existing delay when step stays in non-first positions', () => {
        expect(calculateDelayAfterReorder('step-2', 2, 3, 5)).toBe(5);
        expect(calculateDelayAfterReorder('step-3', 3, 2, 7)).toBe(7);
    });

    it('should preserve delay when step stays at same position', () => {
        expect(calculateDelayAfterReorder('step-2', 2, 2, 5)).toBe(5);
    });
});
