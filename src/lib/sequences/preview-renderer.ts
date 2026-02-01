/**
 * Preview Renderer - Variable Replacement for Email Previews
 * Story 4.5: Copilot Email Preview (Mandatory)
 * Task 2: Create Preview Variable Renderer
 *
 * @module lib/sequences/preview-renderer
 */

import { VARIABLE_REGEX, VALID_VARIABLE_NAMES } from '@/lib/constants/template-variables';

/**
 * Result of rendering a preview with variable replacement
 */
export interface PreviewRenderResult {
    /** The rendered content with variables replaced */
    rendered: string;
    /** List of variable names that were in the template but not in prospect data */
    missingVariables: string[];
}

/**
 * Preview prospect type - simplified version for preview rendering
 * Used when actual Prospect data is not available (sample data)
 */
export interface PreviewProspect {
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    title: string | null;
    email: string;
}

/**
 * Maps prospect fields to template variable names
 * Prospect uses camelCase, templates use snake_case
 */
const PROSPECT_FIELD_MAP: Record<string, keyof PreviewProspect | null> = {
    first_name: 'firstName',
    last_name: 'lastName',
    company: 'company',
    title: 'title',
    email: 'email',
};

/**
 * Get the value of a prospect field for a given variable name
 * @param prospect - The prospect object
 * @param variableName - The template variable name (snake_case)
 * @returns The value as a string, or null if not found/empty
 */
function getProspectValue(prospect: PreviewProspect, variableName: string): string | null {
    const fieldName = PROSPECT_FIELD_MAP[variableName.toLowerCase()];
    if (!fieldName) return null;

    const value = prospect[fieldName];
    if (value === null || value === undefined || value === '') return null;

    return String(value);
}

/**
 * Render template content with prospect data
 * Replaces {{variable}} patterns with actual values
 *
 * @param content - The template content with {{variables}}
 * @param prospect - The prospect data to use for replacement
 * @returns Object with rendered content and list of missing variables
 *
 * @example
 * ```ts
 * const result = renderPreview(
 *   'Bonjour {{first_name}}, votre entreprise {{company}} nous intéresse.',
 *   { firstName: 'Sophie', lastName: 'Martin', company: 'TechCorp', ... }
 * );
 * // result.rendered = 'Bonjour Sophie, votre entreprise TechCorp nous intéresse.'
 * // result.missingVariables = []
 * ```
 */
export function renderPreview(
    content: string,
    prospect: PreviewProspect
): PreviewRenderResult {
    const missingVariables: string[] = [];
    const seenVariables = new Set<string>();

    // Replace all {{variable}} patterns
    const rendered = content.replace(VARIABLE_REGEX, (match, variableName: string) => {
        const lowerName = variableName.toLowerCase();

        // Check if it's a valid/known variable
        if (!VALID_VARIABLE_NAMES.has(lowerName)) {
            // Unknown variable - leave as-is but track as missing
            if (!seenVariables.has(lowerName)) {
                missingVariables.push(variableName);
                seenVariables.add(lowerName);
            }
            return match; // Return original {{unknown_var}}
        }

        // Get the value from prospect
        const value = getProspectValue(prospect, lowerName);

        if (value === null) {
            // Known variable but missing value
            if (!seenVariables.has(lowerName)) {
                missingVariables.push(variableName);
                seenVariables.add(lowerName);
            }
            return ''; // Replace with empty string
        }

        return value;
    });

    return {
        rendered,
        missingVariables,
    };
}

/**
 * Render both subject and body for a complete email preview
 */
export function renderEmailPreview(
    subject: string,
    body: string,
    prospect: PreviewProspect
): {
    subject: PreviewRenderResult;
    body: PreviewRenderResult;
    totalMissingVariables: string[];
} {
    const subjectResult = renderPreview(subject, prospect);
    const bodyResult = renderPreview(body, prospect);

    // Combine missing variables (unique)
    const allMissing = new Set([
        ...subjectResult.missingVariables,
        ...bodyResult.missingVariables,
    ]);

    return {
        subject: subjectResult,
        body: bodyResult,
        totalMissingVariables: Array.from(allMissing),
    };
}

/**
 * Count total warnings for a set of email previews
 * Used to determine if confirmation dialog is needed
 */
export function countPreviewWarnings(
    previews: Array<{ missingVariables: string[] }>
): number {
    return previews.reduce((count, p) => count + p.missingVariables.length, 0);
}
