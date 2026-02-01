/**
 * Idempotency Key Utilities
 * Story 5.4: Email Scheduling Queue (DB Pillar with Idempotency)
 * 
 * Idempotency keys ensure each email is only sent once.
 * Format: {prospectId}:{sequenceId}:{stepNumber}
 */

export const IDEMPOTENCY_SEPARATOR = ':';

/**
 * Generate an idempotency key for an email
 * 
 * @param prospectId - The prospect's unique ID
 * @param sequenceId - The sequence's unique ID
 * @param stepNumber - The step number in the sequence (1-indexed)
 * @returns Formatted idempotency key
 */
export function generateIdempotencyKey(
    prospectId: string,
    sequenceId: string,
    stepNumber: number
): string {
    // Validate inputs
    if (!prospectId || prospectId.trim() === '') {
        throw new Error('Invalid idempotency key: prospectId is required');
    }
    if (!sequenceId || sequenceId.trim() === '') {
        throw new Error('Invalid idempotency key: sequenceId is required');
    }
    if (!Number.isInteger(stepNumber) || stepNumber < 1) {
        throw new Error('Invalid idempotency key: stepNumber must be a positive integer');
    }

    return `${prospectId}${IDEMPOTENCY_SEPARATOR}${sequenceId}${IDEMPOTENCY_SEPARATOR}${stepNumber}`;
}

/**
 * Parse an idempotency key back to its components
 * 
 * @param key - The idempotency key to parse
 * @returns Object with prospectId, sequenceId, and stepNumber
 * @throws Error if the key format is invalid
 */
export function parseIdempotencyKey(key: string): {
    prospectId: string;
    sequenceId: string;
    stepNumber: number;
} {
    if (!key || key.trim() === '') {
        throw new Error('Invalid idempotency key: key is required');
    }

    const parts = key.split(IDEMPOTENCY_SEPARATOR);

    if (parts.length !== 3) {
        throw new Error(`Invalid idempotency key format: expected 3 parts separated by "${IDEMPOTENCY_SEPARATOR}", got ${parts.length}`);
    }

    const [prospectId, sequenceId, stepNumberStr] = parts;

    if (!prospectId || prospectId.trim() === '') {
        throw new Error('Invalid idempotency key: prospectId is empty');
    }
    if (!sequenceId || sequenceId.trim() === '') {
        throw new Error('Invalid idempotency key: sequenceId is empty');
    }

    const stepNumber = parseInt(stepNumberStr, 10);

    if (isNaN(stepNumber) || stepNumber < 1) {
        throw new Error(`Invalid idempotency key: stepNumber "${stepNumberStr}" is not a valid positive integer`);
    }

    return {
        prospectId,
        sequenceId,
        stepNumber,
    };
}

/**
 * Validate that an idempotency key is well-formed
 * 
 * @param key - The key to validate
 * @returns true if valid, false otherwise
 */
export function isValidIdempotencyKey(key: string): boolean {
    try {
        parseIdempotencyKey(key);
        return true;
    } catch {
        return false;
    }
}
