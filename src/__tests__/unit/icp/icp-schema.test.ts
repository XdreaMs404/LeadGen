import { describe, it, expect } from 'vitest';
import { IcpConfigInputSchema, COMPANY_SIZE_OPTIONS } from '@/types/icp';

describe('IcpConfigInputSchema', () => {
    describe('validation des données valides', () => {
        it('valide un ICP complet', () => {
            const input = {
                industries: ['Tech', 'SaaS'],
                companySizes: ['1-10', '11-50'],
                roles: ['CEO', 'CTO'],
                locations: ['France'],
            };
            const result = IcpConfigInputSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('valide un ICP vide (tous les champs optionnels)', () => {
            const result = IcpConfigInputSchema.safeParse({});
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.industries).toEqual([]);
                expect(result.data.companySizes).toEqual([]);
                expect(result.data.roles).toEqual([]);
                expect(result.data.locations).toEqual([]);
            }
        });

        it('valide avec certains champs remplis', () => {
            const input = {
                industries: ['Fintech'],
            };
            const result = IcpConfigInputSchema.safeParse(input);
            expect(result.success).toBe(true);
        });
    });

    describe('validation des tailles d\'entreprise', () => {
        it('accepte toutes les tailles valides', () => {
            COMPANY_SIZE_OPTIONS.forEach((size) => {
                const result = IcpConfigInputSchema.safeParse({
                    companySizes: [size],
                });
                expect(result.success).toBe(true);
            });
        });

        it('rejette une taille invalide', () => {
            const result = IcpConfigInputSchema.safeParse({
                companySizes: ['invalid-size'],
            });
            expect(result.success).toBe(false);
        });

        it('rejette un mix de valides et invalides', () => {
            const result = IcpConfigInputSchema.safeParse({
                companySizes: ['1-10', 'wrong'],
            });
            expect(result.success).toBe(false);
        });
    });

    describe('validation des types', () => {
        it('rejette industries non-array', () => {
            const result = IcpConfigInputSchema.safeParse({
                industries: 'Tech',
            });
            expect(result.success).toBe(false);
        });

        it('rejette roles non-array', () => {
            const result = IcpConfigInputSchema.safeParse({
                roles: 'CEO',
            });
            expect(result.success).toBe(false);
        });
    });
});

describe('COMPANY_SIZE_OPTIONS', () => {
    it('contient les 5 options attendues', () => {
        expect(COMPANY_SIZE_OPTIONS).toHaveLength(5);
        expect(COMPANY_SIZE_OPTIONS).toContain('1-10');
        expect(COMPANY_SIZE_OPTIONS).toContain('11-50');
        expect(COMPANY_SIZE_OPTIONS).toContain('51-200');
        expect(COMPANY_SIZE_OPTIONS).toContain('201-500');
        expect(COMPANY_SIZE_OPTIONS).toContain('500+');
    });
});
