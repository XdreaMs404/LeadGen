/**
 * Template Variable Renderer
 * Renders template content by replacing variables with prospect data.
 * 
 * @module lib/template/render-variables
 * @story 4.3 Template Variables System with Picker
 */

import { VARIABLE_REGEX, VALID_VARIABLE_NAMES } from '@/lib/constants/template-variables';

/**
 * Prospect data type for variable rendering
 */
export interface ProspectData {
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    title?: string | null;
    email?: string | null;
}

/**
 * Options for template rendering
 */
export interface RenderOptions {
    /** Whether to highlight missing values with visual indicator */
    highlightMissing?: boolean;
}

/**
 * Result of template rendering
 */
export interface RenderResult {
    /** Rendered HTML with variables replaced */
    html: string;
    /** Plain text version (HTML tags stripped) */
    text: string;
    /** List of field names that were empty/null for this prospect */
    missingFields: string[];
    /** List of variable names found that are not valid */
    invalidVariables: string[];
}

/**
 * Maps variable names to Prospect field values
 */
function getVariableMap(prospect: ProspectData): Record<string, string | null | undefined> {
    return {
        first_name: prospect.firstName,
        last_name: prospect.lastName,
        company: prospect.company,
        title: prospect.title,
        email: prospect.email,
    };
}

/**
 * Renders a template by replacing variables with prospect data.
 * 
 * @param template - The template string with {{variable}} placeholders
 * @param prospect - Prospect data to use for replacements
 * @param options - Rendering options (e.g., highlight missing values)
 * @returns RenderResult with rendered content and metadata
 * 
 * @example
 * ```ts
 * const result = renderTemplate(
 *   'Hello {{first_name}}, welcome to {{company}}!',
 *   { firstName: 'Marie', company: null },
 *   { highlightMissing: true }
 * );
 * // result.html = 'Hello Marie, welcome to <span class="...">​[vide]​</span>!'
 * // result.missingFields = ['company']
 * ```
 */
export function renderTemplate(
    template: string,
    prospect: ProspectData,
    options: RenderOptions = {}
): RenderResult {
    const missingFields: string[] = [];
    const invalidVariables: string[] = [];
    const variableMap = getVariableMap(prospect);

    // Reset regex for each call
    const regex = new RegExp(VARIABLE_REGEX.source, VARIABLE_REGEX.flags);

    const rendered = template.replace(regex, (match, varName) => {
        const lowerName = varName.toLowerCase();

        // Check if variable is valid
        if (!VALID_VARIABLE_NAMES.has(lowerName)) {
            invalidVariables.push(varName);
            return match; // Keep invalid variables as-is
        }

        // Get value from prospect data
        const value = variableMap[lowerName];

        // Handle missing/empty values
        if (value == null || value === '') {
            missingFields.push(varName);
            if (options.highlightMissing) {
                return `<span class="bg-amber-100 dark:bg-amber-900/30 px-1 rounded text-amber-800 dark:text-amber-200">[vide]</span>`;
            }
            return '';
        }

        return value;
    });

    return {
        html: rendered,
        text: stripHtmlTags(rendered),
        missingFields: [...new Set(missingFields)],
        invalidVariables: [...new Set(invalidVariables)],
    };
}

/**
 * Strips HTML tags from a string
 */
function stripHtmlTags(html: string): string {
    // TODO: Use a proper HTML parser (e.g., DOMParser or sanitize-html) for robustness
    // This regex is a simple MVP solution but can be brittle
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Counts how many prospects would have missing values for used variables.
 * Useful for showing warnings like "X prospects ont un champ 'company' vide".
 * 
 * @param template - The template with variables
 * @param prospects - Array of prospect data to check
 * @returns Map of variable name to count of prospects missing that field
 */
export function countMissingFieldsByProspect(
    template: string,
    prospects: ProspectData[]
): Map<string, number> {
    const regex = new RegExp(VARIABLE_REGEX.source, VARIABLE_REGEX.flags);
    const usedVariables = new Set<string>();

    // Extract all used variables
    let match;
    while ((match = regex.exec(template)) !== null) {
        const varName = match[1].toLowerCase();
        if (VALID_VARIABLE_NAMES.has(varName)) {
            usedVariables.add(varName);
        }
    }

    // Count missing for each variable across prospects
    const counts = new Map<string, number>();

    for (const varName of usedVariables) {
        let missingCount = 0;
        for (const prospect of prospects) {
            const variableMap = getVariableMap(prospect);
            const value = variableMap[varName];
            if (value == null || value === '') {
                missingCount++;
            }
        }
        if (missingCount > 0) {
            counts.set(varName, missingCount);
        }
    }

    return counts;
}
