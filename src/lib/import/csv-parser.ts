/**
 * CSV Parser Service
 * Story 3.2: CSV Import with Source Tracking & Validation
 */
import Papa from 'papaparse';
import type { CsvParseResult } from '@/types/prospect';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Parse a CSV file and extract headers and rows
 * @param file - The CSV file to parse
 * @returns Parsed headers and rows
 * @throws Error if file exceeds max size
 */
export async function parseCsvFile(file: File): Promise<CsvParseResult> {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('Le fichier dépasse la taille maximale de 5MB');
    }

    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            transformHeader: (header: string) => header.trim(),
            complete: (results) => {
                resolve({
                    headers: results.meta.fields || [],
                    rows: results.data as Record<string, string>[],
                    errors: results.errors.map(e => ({
                        message: e.message,
                        row: e.row,
                    })),
                });
            },
            error: (error: Error) => reject(error),
        });
    });
}

/**
 * Parse CSV from text content (for server-side use)
 * @param content - CSV content as string
 * @returns Parsed headers and rows
 */
export function parseCsvContent(content: string): CsvParseResult {
    const results = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
    });

    return {
        headers: results.meta.fields || [],
        rows: results.data as Record<string, string>[],
        errors: results.errors.map(e => ({
            message: e.message,
            row: e.row,
        })),
    };
}

/**
 * Convert rows back to CSV format
 * @param headers - Column headers
 * @param rows - Data rows
 * @returns CSV string
 */
export function rowsToCsv(headers: string[], rows: Record<string, string>[]): string {
    return Papa.unparse({
        fields: headers,
        data: rows,
    });
}

/**
 * Get max file size constant for UI validation
 */
export const CSV_MAX_FILE_SIZE = MAX_FILE_SIZE;
export const CSV_MAX_FILE_SIZE_MB = MAX_FILE_SIZE / (1024 * 1024);
