/**
 * Template Variable Constants
 * Defines variables available for email personalization in sequences.
 * 
 * @module lib/constants/template-variables
 * @story 4.3 Template Variables System with Picker
 */

/**
 * Available template variables for email personalization
 * Maps to Prospect fields in the database
 */
export const TEMPLATE_VARIABLES = [
    { name: 'first_name', label: 'Prénom', description: 'Prénom du prospect' },
    { name: 'last_name', label: 'Nom', description: 'Nom de famille du prospect' },
    { name: 'company', label: 'Entreprise', description: "Nom de l'entreprise" },
    { name: 'title', label: 'Poste', description: 'Fonction/titre du prospect' },
    { name: 'email', label: 'Email', description: 'Adresse email du prospect' },
] as const;

/**
 * Type representing valid template variable names
 */
export type TemplateVariableName = (typeof TEMPLATE_VARIABLES)[number]['name'];

/**
 * Type representing a template variable definition
 */
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

/**
 * Regex pattern to match {{variable_name}} in templates
 * - Captures the variable name without braces
 * - Case-insensitive matching
 * - Supports lowercase letters, underscores, and digits (digits not as first char)
 */
export const VARIABLE_REGEX = /\{\{([a-z][a-z0-9_]*)\}\}/gi;

/**
 * Set of valid variable names for O(1) validation lookup
 */
export const VALID_VARIABLE_NAMES = new Set<string>(
    TEMPLATE_VARIABLES.map((v) => v.name)
);

/**
 * Check if a variable name is valid
 * @param name - The variable name to check (without braces)
 * @returns true if the variable is known and valid
 */
export function isValidVariableName(name: string): name is TemplateVariableName {
    return VALID_VARIABLE_NAMES.has(name.toLowerCase());
}

/**
 * Get the label for a variable (for display purposes)
 * @param name - The variable name to look up
 * @returns The French label or undefined if not found
 */
export function getVariableLabel(name: string): string | undefined {
    return TEMPLATE_VARIABLES.find((v) => v.name === name.toLowerCase())?.label;
}
