/**
 * Error Report Generator
 * Story 3.2: CSV Import with Source Tracking & Validation
 */
import type { ValidationError } from '@/types/prospect';
import { rowsToCsv } from './csv-parser';

/**
 * Generate a downloadable CSV error report
 * @param errors - List of validation errors
 * @returns CSV string with error details
 */
export function generateErrorCsv(errors: ValidationError[]): string {
    const headers = ['Ligne', 'Colonne', 'Erreur'];
    const rows = errors.map(error => ({
        'Ligne': error.rowNumber.toString(),
        'Colonne': error.column,
        'Erreur': error.error,
    }));

    return rowsToCsv(headers, rows);
}

/**
 * Create a downloadable Blob from error CSV
 * @param errors - List of validation errors
 * @returns Blob with CSV content
 */
export function createErrorBlob(errors: ValidationError[]): Blob {
    const csvContent = generateErrorCsv(errors);
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Download error report as CSV file
 * @param errors - List of validation errors
 * @param filename - Name of the downloaded file (without extension)
 */
export function downloadErrorReport(errors: ValidationError[], filename = 'import-errors'): void {
    const blob = createErrorBlob(errors);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Get error summary for display
 */
export function getErrorSummary(errors: ValidationError[]): {
    total: number;
    byColumn: Record<string, number>;
    byType: Record<string, number>;
} {
    const byColumn: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const error of errors) {
        byColumn[error.column] = (byColumn[error.column] || 0) + 1;
        byType[error.error] = (byType[error.error] || 0) + 1;
    }

    return {
        total: errors.length,
        byColumn,
        byType,
    };
}
