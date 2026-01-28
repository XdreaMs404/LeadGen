/**
 * CSV Parser Tests
 * Story 3.2: CSV Import with Source Tracking & Validation
 */
import { describe, it, expect } from 'vitest';
import { parseCsvContent, CSV_MAX_FILE_SIZE } from '@/lib/import/csv-parser';

describe('CSV Parser', () => {
    describe('parseCsvContent', () => {
        it('should parse basic CSV with headers', () => {
            const csv = `email,firstName,lastName
john@example.com,John,Doe
jane@example.com,Jane,Smith`;

            const result = parseCsvContent(csv);

            expect(result.headers).toEqual(['email', 'firstName', 'lastName']);
            expect(result.rows).toHaveLength(2);
            expect(result.rows[0]).toEqual({
                email: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
            });
        });

        it('should handle empty CSV', () => {
            const csv = '';
            const result = parseCsvContent(csv);
            expect(result.rows).toHaveLength(0);
        });

        it('should skip empty lines', () => {
            const csv = `email,name
test@example.com,Test

another@example.com,Another`;

            const result = parseCsvContent(csv);
            expect(result.rows).toHaveLength(2);
        });

        it('should trim header whitespace', () => {
            const csv = ` email , name 
test@example.com,Test`;

            const result = parseCsvContent(csv);
            expect(result.headers).toEqual(['email', 'name']);
        });

        it('should handle French column names', () => {
            const csv = `email,prénom,nom,entreprise
test@example.com,Jean,Dupont,ACME`;

            const result = parseCsvContent(csv);
            expect(result.headers).toContain('prénom');
            expect(result.headers).toContain('entreprise');
        });

        it('should handle quoted values with commas', () => {
            const csv = `email,company
test@example.com,"Acme, Inc."`;

            const result = parseCsvContent(csv);
            expect(result.rows[0].company).toBe('Acme, Inc.');
        });
    });

    describe('CSV_MAX_FILE_SIZE', () => {
        it('should be 5MB', () => {
            expect(CSV_MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
        });
    });
});
