/**
 * Prospect Types & Zod Schemas
 * Story 3.2: CSV Import with Source Tracking & Validation
 */
import { z } from 'zod';

// Strict email validation: requires valid TLD (at least 2 chars after last dot)
// Examples: ✓ john@example.com, ✓ user@mail.co.uk | ✗ a@a, ✗ test@domain
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// ===== Enums =====

export const ProspectSourceEnum = z.enum([
    'CRM_EXPORT',
    'EVENT_CONFERENCE',
    'NETWORK_REFERRAL',
    'CONTENT_DOWNLOAD',
    'OUTBOUND_RESEARCH',
    'OTHER',
]);
export type ProspectSource = z.infer<typeof ProspectSourceEnum>;

export const ProspectStatusEnum = z.enum([
    'NEW',
    'ENRICHING',
    'VERIFIED',
    'NOT_VERIFIED',
    'NEEDS_REVIEW',
    'SUPPRESSED',
    'CONTACTED',
    'REPLIED',
    'BOUNCED',
    'UNSUBSCRIBED',
    'BOOKED',
]);
export type ProspectStatus = z.infer<typeof ProspectStatusEnum>;

// ===== Source Options (French Labels) =====

export const SOURCE_OPTIONS = [
    { value: 'CRM_EXPORT', label: 'Export CRM' },
    { value: 'EVENT_CONFERENCE', label: 'Événement / Conférence' },
    { value: 'NETWORK_REFERRAL', label: 'Réseau / Recommandation' },
    { value: 'CONTENT_DOWNLOAD', label: 'Téléchargement de contenu' },
    { value: 'OUTBOUND_RESEARCH', label: 'Recherche outbound' },
    { value: 'OTHER', label: 'Autre' },
] as const;

// Warning trigger keywords (case-insensitive)
export const RISKY_SOURCE_KEYWORDS = ['paid', 'achat', 'bought', 'purchased', 'unknown', 'inconnu', 'liste'];

// ===== Zod Schemas =====

export const ProspectEmailSchema = z.string().regex(EMAIL_REGEX, 'Format email invalide');

export const ProspectSchema = z.object({
    id: z.string().cuid(),
    workspaceId: z.string().cuid(),
    email: ProspectEmailSchema,
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    company: z.string().nullable(),
    title: z.string().nullable(),
    phone: z.string().nullable(),
    linkedinUrl: z.string().url().nullable().or(z.literal('')),
    source: ProspectSourceEnum,
    sourceDetail: z.string().nullable(),
    status: ProspectStatusEnum,
    enrichmentSource: z.string().nullable(),
    enrichedAt: z.string().nullable(),
    enrichmentData: z.record(z.string(), z.unknown()).nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable(),
    deletedBy: z.string().nullable(),
});
export type Prospect = z.infer<typeof ProspectSchema>;

// Schema for CSV row import validation
export const CsvRowSchema = z.object({
    email: ProspectEmailSchema,
    firstName: z.string().optional().transform(v => v?.trim() || null),
    lastName: z.string().optional().transform(v => v?.trim() || null),
    company: z.string().optional().transform(v => v?.trim() || null),
    title: z.string().optional().transform(v => v?.trim() || null),
    phone: z.string().optional().transform(v => v?.trim() || null),
    linkedinUrl: z.string().optional().transform(v => v?.trim() || null),
});
export type CsvRow = z.infer<typeof CsvRowSchema>;

// Schema for import request
export const ImportRequestSchema = z.object({
    source: ProspectSourceEnum,
    sourceDetail: z.string().nullable().optional(),
    columnMapping: z.record(z.string(), z.string()),
});
export type ImportRequest = z.infer<typeof ImportRequestSchema>;

// Import result type
export interface ImportResult {
    imported: number;
    duplicates: number;
    errors: number;
}

// Validation error type
export interface ValidationError {
    rowNumber: number;
    column: string;
    error: string;
}

// CSV parse result type
export interface CsvParseResult {
    headers: string[];
    rows: Record<string, string>[];
    errors: { message: string; row?: number }[];
}

// Validation result type
export interface ValidationResult {
    validRows: CsvRow[];
    errors: ValidationError[];
    duplicateCount: number;
}

// Column mapping for auto-detection
export const COLUMN_NAME_MAPPINGS: Record<string, string> = {
    // Email
    'email': 'email',
    'e-mail': 'email',
    'mail': 'email',
    'courriel': 'email',
    'adresse email': 'email',
    'adresse mail': 'email',
    // First name
    'firstname': 'firstName',
    'first_name': 'firstName',
    'first name': 'firstName',
    'prénom': 'firstName',
    'prenom': 'firstName',
    // Last name
    'lastname': 'lastName',
    'last_name': 'lastName',
    'last name': 'lastName',
    'nom': 'lastName',
    'nom de famille': 'lastName',
    // Company
    'company': 'company',
    'entreprise': 'company',
    'société': 'company',
    'societe': 'company',
    'organization': 'company',
    'organisation': 'company',
    // Title
    'title': 'title',
    'titre': 'title',
    'poste': 'title',
    'fonction': 'title',
    'job title': 'title',
    'job_title': 'title',
    // Phone
    'phone': 'phone',
    'téléphone': 'phone',
    'telephone': 'phone',
    'tel': 'phone',
    'mobile': 'phone',
    // LinkedIn
    'linkedin': 'linkedinUrl',
    'linkedin_url': 'linkedinUrl',
    'linkedin url': 'linkedinUrl',
    'linkedinurl': 'linkedinUrl',
    'profil linkedin': 'linkedinUrl',
};

/**
 * Auto-map CSV header to prospect field
 */
export function autoMapColumnName(header: string): string | null {
    const normalized = header.toLowerCase().trim();
    return COLUMN_NAME_MAPPINGS[normalized] || null;
}

/**
 * Check if source detail suggests a risky source
 */
export function isRiskySource(sourceDetail: string): boolean {
    const lowerDetail = sourceDetail.toLowerCase();
    return RISKY_SOURCE_KEYWORDS.some(keyword => lowerDetail.includes(keyword));
}

// ===== Manual Prospect Creation Schema (Story 3.3) =====

// Input schema for form (no transforms - matches form values exactly)
export const ProspectCreateInputSchema = z.object({
    email: z.string().min(1, 'Email requis').regex(EMAIL_REGEX, 'Format email invalide'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    phone: z.string().optional(),
    linkedinUrl: z.string().optional(),
    source: ProspectSourceEnum,
    sourceDetail: z.string().optional(),
});

// For form type inference
export type ProspectCreateInput = z.infer<typeof ProspectCreateInputSchema>;

// Validation schema for API (with transforms for normalization)
export const ProspectCreateSchema = z.object({
    email: z.string().regex(EMAIL_REGEX, 'Format email invalide'),
    firstName: z.string().optional().transform(v => v?.trim() || undefined),
    lastName: z.string().optional().transform(v => v?.trim() || undefined),
    company: z.string().optional().transform(v => v?.trim() || undefined),
    title: z.string().optional().transform(v => v?.trim() || undefined),
    phone: z.string().optional().transform(v => v?.trim() || undefined),
    linkedinUrl: z.string().url('URL LinkedIn invalide').optional().or(z.literal('')).transform(v => v?.trim() || undefined),
    source: ProspectSourceEnum,
    sourceDetail: z.string().optional().transform(v => v?.trim() || undefined),
});
