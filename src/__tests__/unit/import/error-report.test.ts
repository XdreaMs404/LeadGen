/**
 * Error Report Tests
 * Story 3.2: CSV Import with Source Tracking & Validation
 */
import { describe, it, expect } from 'vitest';
import { generateErrorCsv, getErrorSummary } from '@/lib/import/error-report';
import type { ValidationError } from '@/types/prospect';

describe('Error Report', () => {
    const sampleErrors: ValidationError[] = [
        { rowNumber: 2, column: 'email', error: 'Format email invalide' },
        { rowNumber: 5, column: 'email', error: 'Doublon dans le fichier' },
        { rowNumber: 8, column: 'email', error: 'Format email invalide' },
        { rowNumber: 10, column: 'phone', error: 'Format invalide' },
    ];

    describe('generateErrorCsv', () => {
        it('should generate CSV with headers', () => {
            const csv = generateErrorCsv(sampleErrors);
            const lines = csv.split('\n');

            expect(lines[0]).toContain('Ligne');
            expect(lines[0]).toContain('Colonne');
            expect(lines[0]).toContain('Erreur');
        });

        it('should include all error rows', () => {
            const csv = generateErrorCsv(sampleErrors);
            const lines = csv.split('\n');

            // Header + 4 data rows
            expect(lines.length).toBeGreaterThanOrEqual(5);
        });

        it('should handle empty errors array', () => {
            const csv = generateErrorCsv([]);
            expect(csv).toBeDefined();
        });
    });

    describe('getErrorSummary', () => {
        it('should count total errors', () => {
            const summary = getErrorSummary(sampleErrors);
            expect(summary.total).toBe(4);
        });

        it('should count errors by column', () => {
            const summary = getErrorSummary(sampleErrors);
            expect(summary.byColumn['email']).toBe(3);
            expect(summary.byColumn['phone']).toBe(1);
        });

        it('should count errors by type', () => {
            const summary = getErrorSummary(sampleErrors);
            expect(summary.byType['Format email invalide']).toBe(2);
            expect(summary.byType['Doublon dans le fichier']).toBe(1);
        });

        it('should handle empty errors', () => {
            const summary = getErrorSummary([]);
            expect(summary.total).toBe(0);
            expect(Object.keys(summary.byColumn)).toHaveLength(0);
        });
    });
});
