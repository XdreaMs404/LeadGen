/**
 * CSV Validation Service
 * Story 3.2: CSV Import with Source Tracking & Validation
 */
import { prisma } from '@/lib/prisma/client';
import {
    CsvRowSchema,
    EMAIL_REGEX,
    type CsvRow,
    type ValidationError,
    type ValidationResult,
} from '@/types/prospect';

/**
 * Validate CSV rows and check for duplicates
 * @param rows - Raw CSV rows
 * @param workspaceId - Workspace to check for existing prospects
 * @param columnMapping - Mapping from CSV headers to prospect fields
 * @returns Validation result with valid rows, errors, and duplicate count
 */
export async function validateCsvRows(
    rows: Record<string, string>[],
    workspaceId: string,
    columnMapping: Record<string, string>
): Promise<ValidationResult> {
    const validRows: CsvRow[] = [];
    const errors: ValidationError[] = [];
    const seenEmails = new Set<string>();
    let duplicateCount = 0;

    // Map column names from CSV to prospect fields
    const mappedRows = rows.map(row => mapRowFields(row, columnMapping));

    // Get all emails to check for intra-file duplicates first
    const allEmails = mappedRows
        .map((row, index) => ({ email: row.email?.toLowerCase().trim(), index }))
        .filter(({ email }) => email);

    // Check for existing prospects in database (batch query for performance)
    const emailsToCheck = [...new Set(allEmails.map(e => e.email).filter(Boolean) as string[])];
    const existingProspects = await prisma.prospect.findMany({
        where: {
            workspaceId,
            email: { in: emailsToCheck },
        },
        select: { email: true },
    });
    const existingEmails = new Set(existingProspects.map(p => p.email.toLowerCase()));

    // Validate each row
    for (let i = 0; i < mappedRows.length; i++) {
        const row = mappedRows[i];
        const rowNumber = i + 2; // Account for header row and 1-indexing

        // Check email is present
        if (!row.email) {
            errors.push({
                rowNumber,
                column: 'email',
                error: 'Email manquant',
            });
            continue;
        }

        const email = row.email.toLowerCase().trim();

        // Validate email format
        if (!EMAIL_REGEX.test(email)) {
            errors.push({
                rowNumber,
                column: 'email',
                error: 'Format email invalide',
            });
            continue;
        }

        // Check for intra-file duplicate
        if (seenEmails.has(email)) {
            errors.push({
                rowNumber,
                column: 'email',
                error: 'Doublon dans le fichier',
            });
            duplicateCount++;
            continue;
        }
        seenEmails.add(email);

        // Check for existing prospect in database
        if (existingEmails.has(email)) {
            errors.push({
                rowNumber,
                column: 'email',
                error: 'Prospect déjà existant',
            });
            duplicateCount++;
            continue;
        }

        // Validate row with Zod schema
        const parsed = CsvRowSchema.safeParse({ ...row, email });
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            errors.push({
                rowNumber,
                column: firstIssue?.path[0]?.toString() || 'unknown',
                error: firstIssue?.message || 'Erreur de validation',
            });
            continue;
        }

        validRows.push(parsed.data);
    }

    return {
        validRows,
        errors,
        duplicateCount,
    };
}

/**
 * Map raw CSV row fields to prospect field names using column mapping
 */
function mapRowFields(
    row: Record<string, string>,
    columnMapping: Record<string, string>
): Partial<CsvRow> & { email?: string } {
    const mapped: Record<string, string | undefined> = {};

    for (const [csvColumn, prospectField] of Object.entries(columnMapping)) {
        if (prospectField && row[csvColumn] !== undefined) {
            mapped[prospectField] = row[csvColumn];
        }
    }

    return mapped as Partial<CsvRow> & { email?: string };
}

/**
 * Validate a single email format
 */
export function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
}

/**
 * Count potential issues in CSV preview (for UI feedback)
 */
export function previewValidation(
    rows: Record<string, string>[],
    columnMapping: Record<string, string>
): { validCount: number; errorCount: number } {
    let validCount = 0;
    let errorCount = 0;
    const seenEmails = new Set<string>();

    for (const row of rows) {
        const mapped = mapRowFields(row, columnMapping);
        const email = mapped.email?.toLowerCase().trim();

        if (!email || !EMAIL_REGEX.test(email) || seenEmails.has(email)) {
            errorCount++;
        } else {
            validCount++;
            seenEmails.add(email);
        }
    }

    return { validCount, errorCount };
}
