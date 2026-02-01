/**
 * Unit Tests for Idempotency Utilities
 * Story 5.4: Email Scheduling Queue (DB Pillar with Idempotency)
 */

import { describe, it, expect } from 'vitest';
import {
    generateIdempotencyKey,
    parseIdempotencyKey,
    isValidIdempotencyKey,
    IDEMPOTENCY_SEPARATOR
} from '@/lib/utils/idempotency';

describe('generateIdempotencyKey', () => {
    it('should generate a key with correct format', () => {
        const key = generateIdempotencyKey('prospect-123', 'sequence-456', 1);
        expect(key).toBe('prospect-123:sequence-456:1');
    });

    it('should use the correct separator', () => {
        const key = generateIdempotencyKey('a', 'b', 3);
        expect(key).toContain(IDEMPOTENCY_SEPARATOR);
        expect(key.split(IDEMPOTENCY_SEPARATOR)).toHaveLength(3);
    });

    it('should handle step numbers correctly', () => {
        expect(generateIdempotencyKey('p', 's', 1)).toBe('p:s:1');
        expect(generateIdempotencyKey('p', 's', 2)).toBe('p:s:2');
        expect(generateIdempotencyKey('p', 's', 3)).toBe('p:s:3');
    });

    it('should throw error for empty prospectId', () => {
        expect(() => generateIdempotencyKey('', 'seq', 1)).toThrow('prospectId is required');
        expect(() => generateIdempotencyKey('  ', 'seq', 1)).toThrow('prospectId is required');
    });

    it('should throw error for empty sequenceId', () => {
        expect(() => generateIdempotencyKey('prospect', '', 1)).toThrow('sequenceId is required');
        expect(() => generateIdempotencyKey('prospect', '   ', 1)).toThrow('sequenceId is required');
    });

    it('should throw error for invalid stepNumber', () => {
        expect(() => generateIdempotencyKey('p', 's', 0)).toThrow('positive integer');
        expect(() => generateIdempotencyKey('p', 's', -1)).toThrow('positive integer');
        expect(() => generateIdempotencyKey('p', 's', 1.5)).toThrow('positive integer');
    });
});

describe('parseIdempotencyKey', () => {
    it('should parse a valid key correctly', () => {
        const result = parseIdempotencyKey('prospect-123:sequence-456:2');
        expect(result).toEqual({
            prospectId: 'prospect-123',
            sequenceId: 'sequence-456',
            stepNumber: 2,
        });
    });

    it('should handle simple keys', () => {
        const result = parseIdempotencyKey('a:b:1');
        expect(result.prospectId).toBe('a');
        expect(result.sequenceId).toBe('b');
        expect(result.stepNumber).toBe(1);
    });

    it('should throw error for empty key', () => {
        expect(() => parseIdempotencyKey('')).toThrow('key is required');
        expect(() => parseIdempotencyKey('  ')).toThrow('key is required');
    });

    it('should throw error for invalid format (too few parts)', () => {
        expect(() => parseIdempotencyKey('prospect:sequence')).toThrow('expected 3 parts');
        expect(() => parseIdempotencyKey('single')).toThrow('expected 3 parts');
    });

    it('should throw error for invalid format (too many parts)', () => {
        expect(() => parseIdempotencyKey('a:b:c:d')).toThrow('expected 3 parts');
    });

    it('should throw error for empty prospectId in key', () => {
        expect(() => parseIdempotencyKey(':seq:1')).toThrow('prospectId is empty');
    });

    it('should throw error for empty sequenceId in key', () => {
        expect(() => parseIdempotencyKey('prospect::1')).toThrow('sequenceId is empty');
    });

    it('should throw error for invalid stepNumber in key', () => {
        expect(() => parseIdempotencyKey('p:s:abc')).toThrow('not a valid positive integer');
        expect(() => parseIdempotencyKey('p:s:0')).toThrow('not a valid positive integer');
        expect(() => parseIdempotencyKey('p:s:-1')).toThrow('not a valid positive integer');
    });
});

describe('isValidIdempotencyKey', () => {
    it('should return true for valid keys', () => {
        expect(isValidIdempotencyKey('prospect-123:sequence-456:1')).toBe(true);
        expect(isValidIdempotencyKey('a:b:1')).toBe(true);
        expect(isValidIdempotencyKey('cm123abc:cm456def:3')).toBe(true);
    });

    it('should return false for invalid keys', () => {
        expect(isValidIdempotencyKey('')).toBe(false);
        expect(isValidIdempotencyKey('invalid')).toBe(false);
        expect(isValidIdempotencyKey('a:b')).toBe(false);
        expect(isValidIdempotencyKey('a:b:0')).toBe(false);
        expect(isValidIdempotencyKey(':b:1')).toBe(false);
    });
});

describe('round-trip: generate then parse', () => {
    it('should correctly round-trip', () => {
        const original = {
            prospectId: 'clm123prospect',
            sequenceId: 'clm456sequence',
            stepNumber: 2,
        };

        const key = generateIdempotencyKey(
            original.prospectId,
            original.sequenceId,
            original.stepNumber
        );

        const parsed = parseIdempotencyKey(key);

        expect(parsed).toEqual(original);
    });

    it('should handle CUID-style IDs', () => {
        const prospectId = 'clu1234567890abcdefghij';
        const sequenceId = 'clu0987654321zyxwvutsrq';

        const key = generateIdempotencyKey(prospectId, sequenceId, 1);
        const parsed = parseIdempotencyKey(key);

        expect(parsed.prospectId).toBe(prospectId);
        expect(parsed.sequenceId).toBe(sequenceId);
        expect(parsed.stepNumber).toBe(1);
    });
});
