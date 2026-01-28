/**
 * LLM Types Tests
 * 
 * Story 4.4: LLM Opener Personalization (MVP Safe)
 * Tests for LLM types, error classes, and constants
 */

import { describe, it, expect } from 'vitest';
import {
    LLMError,
    MAX_REGENERATIONS,
    GENERATION_TIMEOUT_MS,
    type OpenerContext,
    type OpenerResult,
    type LLMErrorCode
} from '@/lib/llm/types';

describe('LLM Types', () => {
    describe('LLMError', () => {
        it('should create error with code and message', () => {
            const error = new LLMError('GENERATION_TIMEOUT', 'Request timed out');

            expect(error.code).toBe('GENERATION_TIMEOUT');
            expect(error.message).toBe('Request timed out');
            expect(error.name).toBe('LLMError');
            expect(error.details).toBeUndefined();
        });

        it('should create error with details', () => {
            const details = { originalError: 'Network error' };
            const error = new LLMError('PROVIDER_ERROR', 'API call failed', details);

            expect(error.code).toBe('PROVIDER_ERROR');
            expect(error.message).toBe('API call failed');
            expect(error.details).toEqual(details);
        });

        it('should support all error codes', () => {
            const codes: LLMErrorCode[] = [
                'GENERATION_TIMEOUT',
                'RATE_LIMIT_EXCEEDED',
                'QUOTA_EXCEEDED',
                'PROVIDER_ERROR',
                'INVALID_CONTEXT',
            ];

            codes.forEach((code) => {
                const error = new LLMError(code, 'Test message');
                expect(error.code).toBe(code);
            });
        });
    });

    describe('Constants', () => {
        it('should have MAX_REGENERATIONS set to 3', () => {
            expect(MAX_REGENERATIONS).toBe(3);
        });

        it('should have GENERATION_TIMEOUT_MS set to 30 seconds', () => {
            expect(GENERATION_TIMEOUT_MS).toBe(30_000);
        });
    });

    describe('Type Safety', () => {
        it('should enforce OpenerContext interface', () => {
            const context: OpenerContext = {
                prospectFirstName: 'Jean',
                prospectLastName: 'Dupont',
                prospectCompany: 'Acme Corp',
                prospectTitle: 'CTO',
            };

            expect(context.prospectFirstName).toBe('Jean');
            expect(context.prospectCompany).toBe('Acme Corp');
        });

        it('should allow null values in OpenerContext', () => {
            const context: OpenerContext = {
                prospectFirstName: null,
                prospectLastName: null,
                prospectCompany: null,
                prospectTitle: null,
            };

            expect(context.prospectFirstName).toBeNull();
        });

        it('should enforce OpenerResult interface', () => {
            const result: OpenerResult = {
                text: 'Bonjour Jean, j\'ai vu que vous travaillez chez Acme Corp...',
                generatedAt: '2026-01-28T12:00:00Z',
                regenerationsRemaining: 3,
            };

            expect(result.text).toContain('Jean');
            expect(result.regenerationsRemaining).toBe(3);
        });
    });
});
