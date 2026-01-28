/**
 * Variable Validator Tests
 * Tests for template variable validation logic.
 *
 * @module __tests__/unit/templates/variable-validator.test
 * @story 4.3 Template Variables System with Picker
 */

import { describe, it, expect } from 'vitest';
import {
    validateTemplateVariables,
    extractAllVariables,
} from '@/lib/template/variable-validator';

describe('validateTemplateVariables', () => {
    describe('valid variables', () => {
        it('should identify all valid variables', () => {
            const result = validateTemplateVariables(
                'Bonjour {{first_name}} {{last_name}}'
            );

            expect(result.isValid).toBe(true);
            expect(result.validVariables).toContain('first_name');
            expect(result.validVariables).toContain('last_name');
            expect(result.invalidVariables).toHaveLength(0);
        });

        it('should recognize all supported variables', () => {
            const template = '{{first_name}} {{last_name}} {{company}} {{title}} {{email}}';
            const result = validateTemplateVariables(template);

            expect(result.isValid).toBe(true);
            expect(result.validVariables).toHaveLength(5);
            expect(result.invalidVariables).toHaveLength(0);
        });

        it('should handle case insensitively', () => {
            const result = validateTemplateVariables('{{FIRST_NAME}} {{First_Name}}');

            expect(result.isValid).toBe(true);
            expect(result.validVariables).toContain('first_name');
        });
    });

    describe('invalid variables', () => {
        it('should identify unknown variables', () => {
            const result = validateTemplateVariables(
                'Hello {{first_name}}, your {{unknown_field}} is...'
            );

            expect(result.isValid).toBe(false);
            expect(result.validVariables).toContain('first_name');
            expect(result.invalidVariables).toContain('unknown_field');
        });

        it('should report multiple invalid variables', () => {
            const result = validateTemplateVariables(
                '{{custom1}} and {{custom2}} are not valid'
            );

            expect(result.isValid).toBe(false);
            expect(result.invalidVariables).toContain('custom1');
            expect(result.invalidVariables).toContain('custom2');
        });
    });

    describe('edge cases', () => {
        it('should handle text with no variables', () => {
            const result = validateTemplateVariables('Just plain text');

            expect(result.isValid).toBe(true);
            expect(result.validVariables).toHaveLength(0);
            expect(result.invalidVariables).toHaveLength(0);
        });

        it('should handle empty string', () => {
            const result = validateTemplateVariables('');

            expect(result.isValid).toBe(true);
            expect(result.validVariables).toHaveLength(0);
        });

        it('should handle repeated variables', () => {
            const result = validateTemplateVariables(
                '{{first_name}} et encore {{first_name}}'
            );

            // Should deduplicate
            expect(result.validVariables).toHaveLength(1);
            expect(result.validVariables[0]).toBe('first_name');
        });

        it('should not match incomplete braces', () => {
            const result = validateTemplateVariables('{first_name} {{incomplete');

            // Incomplete braces are not matched by regex at all, so nothing found
            // This means no invalid variables, so isValid is true
            expect(result.isValid).toBe(true);
            expect(result.validVariables).toHaveLength(0);
            expect(result.invalidVariables).toHaveLength(0);
        });

        it('should handle nested/adjacent braces correctly', () => {
            // This edge case tests if regex handles unusual patterns
            const result = validateTemplateVariables('{{{first_name}}}');

            // The middle {{first_name}} should be matched
            expect(result.validVariables).toContain('first_name');
        });

        it('should handle whitespace in variable names gracefully', () => {
            // Variables should only contain a-z and underscores per regex
            const result = validateTemplateVariables('{{ first_name }}');

            // This should NOT match because of the spaces
            expect(result.validVariables).toHaveLength(0);
        });
    });
});

describe('extractAllVariables', () => {
    it('should extract all variable names', () => {
        const variables = extractAllVariables(
            '{{first_name}} {{custom}} {{last_name}}'
        );

        expect(variables).toContain('first_name');
        expect(variables).toContain('custom');
        expect(variables).toContain('last_name');
    });

    it('should deduplicate variables', () => {
        const variables = extractAllVariables('{{name}} {{name}} {{name}}');

        expect(variables).toHaveLength(1);
        expect(variables[0]).toBe('name');
    });

    it('should return empty array for no variables', () => {
        const variables = extractAllVariables('No variables here');

        expect(variables).toHaveLength(0);
    });
});
