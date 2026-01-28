/**
 * Sample Prospect Data for Preview
 * Provides realistic French sample data for email preview mode.
 * 
 * @module lib/template/sample-prospect
 * @story 4.3 Template Variables System with Picker
 */

import type { ProspectData } from './render-variables';

/**
 * Sample prospect with realistic French data for email preview.
 * Used when previewing templates without selecting a specific prospect.
 */
export const SAMPLE_PROSPECT: ProspectData = {
    firstName: 'Marie',
    lastName: 'Dupont',
    company: 'TechCorp France',
    title: 'Directrice Marketing',
    email: 'marie.dupont@techcorp.fr',
};

/**
 * Sample prospect with some missing fields for testing edge cases.
 * Useful for demonstrating how missing fields are handled.
 */
export const SAMPLE_PROSPECT_PARTIAL: ProspectData = {
    firstName: 'Jean',
    lastName: 'Martin',
    company: null,
    title: null,
    email: 'jean.martin@example.fr',
};

/**
 * Creates a sample prospect with custom overrides.
 * 
 * @param overrides - Partial prospect data to override defaults
 * @returns Complete prospect data with overrides applied
 */
export function createSampleProspect(overrides?: Partial<ProspectData>): ProspectData {
    return {
        ...SAMPLE_PROSPECT,
        ...overrides,
    };
}
