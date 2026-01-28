import type { IcpConfig } from '@/types/icp';

/**
 * Prospect interface for ICP matching
 * Uses fields commonly available from CSV import or database
 */
export interface ProspectForMatching {
    industry?: string;
    companySize?: string;
    title?: string;
    role?: string;
    location?: string;
    country?: string;
    city?: string;
}

/**
 * Checks if a prospect matches ANY of the ICP criteria (OR logic).
 * For MVP, uses simple case-insensitive partial matching.
 *
 * @param prospect - The prospect to check
 * @param icpConfig - The ICP configuration to match against
 * @returns true if ANY criterion matches, false if none match or ICP is empty
 *
 * @example
 * // Used in CSV import (Epic 3.2) to filter prospects
 * const matchingProspects = prospects.filter(p => matchesIcp(p, icpConfig));
 */
export function matchesIcp(
    prospect: ProspectForMatching,
    icpConfig: IcpConfig | null
): boolean {
    // If no ICP config or all arrays empty, no filtering
    if (!icpConfig) return true;

    const hasAnyCriteria =
        icpConfig.industries.length > 0 ||
        icpConfig.companySizes.length > 0 ||
        icpConfig.roles.length > 0 ||
        icpConfig.locations.length > 0;

    if (!hasAnyCriteria) return true;

    // Check industries
    if (icpConfig.industries.length > 0 && prospect.industry) {
        const prospectIndustry = prospect.industry.toLowerCase();
        if (icpConfig.industries.some((ind) => matchesPartial(prospectIndustry, ind))) {
            return true;
        }
    }

    // Check company sizes
    if (icpConfig.companySizes.length > 0 && prospect.companySize) {
        if (icpConfig.companySizes.includes(prospect.companySize as typeof icpConfig.companySizes[number])) {
            return true;
        }
    }

    // Check roles/titles
    if (icpConfig.roles.length > 0) {
        const prospectRole = (prospect.role || prospect.title || '').toLowerCase();
        if (prospectRole && icpConfig.roles.some((role) => matchesPartial(prospectRole, role))) {
            return true;
        }
    }

    // Check locations
    if (icpConfig.locations.length > 0) {
        const prospectLocation = [prospect.location, prospect.city, prospect.country]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        if (
            prospectLocation &&
            icpConfig.locations.some((loc) => matchesPartial(prospectLocation, loc))
        ) {
            return true;
        }
    }

    return false;
}

/**
 * Simple case-insensitive partial match
 */
/**
 * Case-insensitive partial match with word boundary check.
 * "Art" will match "Digital Art" but NOT "Smart".
 */
function matchesPartial(value: string, criterion: string): boolean {
    if (!value || !criterion) return false;
    // Escape special regex characters in criterion
    const escaped = criterion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match whole word or part of phrase, but respect boundaries
    // \b matches word boundaries
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    const simpleRegex = new RegExp(`${escaped}`, 'i'); // Fallback/Alternative depending on requirement?

    // For specific criteria like location/industry, simple substring is often too loose.
    // However, for "New York", we might want it to match "New York City".
    // Let's stick to simple includes but strictly for exact substring containment if the criterion is multi-word,
    // and word boundary if single word? 
    // Actually, the issue described "Art" vs "Smart" is a suffix match.
    // "Art" should match "Bachelor of Arts" or "Digital Art".
    // Let's use word boundary check.

    return regex.test(value);
}
