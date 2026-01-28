/**
 * Template Variable Validator
 * Validates template content for known/unknown variables.
 * 
 * @module lib/template/variable-validator
 * @story 4.3 Template Variables System with Picker
 */

import { VARIABLE_REGEX, VALID_VARIABLE_NAMES } from '@/lib/constants/template-variables';

/**
 * Result of template variable validation
 */
export interface ValidationResult {
    /** Whether all found variables are valid (no unknown variables) */
    isValid: boolean;
    /** List of valid variable names found (deduplicated) */
    validVariables: string[];
    /** List of invalid/unknown variable names found (deduplicated) */
    invalidVariables: string[];
}

/**
 * Validates template text for known and unknown variables.
 * Extracts all {{variable}} patterns and categorizes them.
 * 
 * @param text - The template text to validate
 * @returns ValidationResult with valid/invalid variables
 * 
 * @example
 * ```ts
 * const result = validateTemplateVariables('Hello {{first_name}}, your {{unknown_field}} is...');
 * // result.validVariables = ['first_name']
 * // result.invalidVariables = ['unknown_field']
 * // result.isValid = false
 * ```
 */
export function validateTemplateVariables(text: string): ValidationResult {
    const validVariables: string[] = [];
    const invalidVariables: string[] = [];

    // Reset regex lastIndex to ensure consistent matching
    const regex = new RegExp(VARIABLE_REGEX.source, VARIABLE_REGEX.flags);

    let match;
    while ((match = regex.exec(text)) !== null) {
        const varName = match[1].toLowerCase();
        if (VALID_VARIABLE_NAMES.has(varName)) {
            validVariables.push(varName);
        } else {
            invalidVariables.push(match[1]); // Keep original case for display
        }
    }

    return {
        isValid: invalidVariables.length === 0,
        validVariables: [...new Set(validVariables)],
        invalidVariables: [...new Set(invalidVariables)],
    };
}

/**
 * Extracts all variables from template text (regardless of validity).
 * Useful for listing all variables used in a template.
 * 
 * @param text - The template text
 * @returns Array of all variable names found (original case, deduplicated)
 */
export function extractAllVariables(text: string): string[] {
    const variables: string[] = [];
    const regex = new RegExp(VARIABLE_REGEX.source, VARIABLE_REGEX.flags);

    let match;
    while ((match = regex.exec(text)) !== null) {
        variables.push(match[1]);
    }

    return [...new Set(variables)];
}
