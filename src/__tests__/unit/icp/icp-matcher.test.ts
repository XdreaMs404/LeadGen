import { describe, it, expect } from 'vitest';
import { matchesIcp, type ProspectForMatching } from '@/lib/utils/icp-matcher';
import type { IcpConfig } from '@/types/icp';

describe('matchesIcp', () => {
    const baseIcpConfig: IcpConfig = {
        id: 'icp-1',
        workspaceId: 'ws-1',
        industries: ['Tech', 'SaaS'],
        companySizes: ['11-50', '51-200'],
        roles: ['CEO', 'CTO'],
        locations: ['France', 'Paris'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    describe('avec ICP null ou vide', () => {
        it('retourne true si icpConfig est null', () => {
            const prospect: ProspectForMatching = { industry: 'Finance' };
            expect(matchesIcp(prospect, null)).toBe(true);
        });

        it('retourne true si tous les critères ICP sont vides', () => {
            const emptyIcp: IcpConfig = {
                ...baseIcpConfig,
                industries: [],
                companySizes: [],
                roles: [],
                locations: [],
            };
            const prospect: ProspectForMatching = { industry: 'Any' };
            expect(matchesIcp(prospect, emptyIcp)).toBe(true);
        });
    });

    describe('matching par industrie', () => {
        it('retourne true pour correspondance partielle (case-insensitive)', () => {
            const prospect: ProspectForMatching = { industry: 'tech startup' };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(true);
        });

        it('retourne true pour correspondance exacte', () => {
            const prospect: ProspectForMatching = { industry: 'SaaS' };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(true);
        });

        it('ne matche pas une industrie non listée', () => {
            const prospect: ProspectForMatching = { industry: 'Finance' };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(false);
        });

        it('ne matche pas un suffixe sans frontière de mot (ex: Smart vs Art)', () => {
            const icp: IcpConfig = { ...baseIcpConfig, industries: ['Art'] };
            const prospect: ProspectForMatching = { industry: 'Smart' };
            expect(matchesIcp(prospect, icp)).toBe(false);
        });

        it('matche un mot complet dans une expression (ex: Digital Art vs Art)', () => {
            const icp: IcpConfig = { ...baseIcpConfig, industries: ['Art'] };
            const prospect: ProspectForMatching = { industry: 'Digital Art' };
            expect(matchesIcp(prospect, icp)).toBe(true);
        });
    });

    describe('matching par taille entreprise', () => {
        it('retourne true pour correspondance exacte', () => {
            const prospect: ProspectForMatching = { companySize: '11-50' };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(true);
        });

        it('ne matche pas une taille non listée', () => {
            const prospect: ProspectForMatching = { companySize: '500+' };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(false);
        });
    });

    describe('matching par rôle/titre', () => {
        it('retourne true pour correspondance partielle via role', () => {
            const prospect: ProspectForMatching = { role: 'CEO & Co-founder' };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(true);
        });

        it('retourne true pour correspondance partielle via title', () => {
            const prospect: ProspectForMatching = { title: 'CTO at Startup' };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(true);
        });

        it('ne matche pas un rôle non listé', () => {
            const prospect: ProspectForMatching = { role: 'Marketing Manager' };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(false);
        });
    });

    describe('matching par localisation', () => {
        it('retourne true pour correspondance via location', () => {
            const prospect: ProspectForMatching = { location: 'Paris, France' };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(true);
        });

        it('retourne true pour correspondance via country', () => {
            const prospect: ProspectForMatching = { country: 'France' };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(true);
        });

        it('retourne true pour correspondance via city', () => {
            const prospect: ProspectForMatching = { city: 'Paris' };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(true);
        });

        it('ne matche pas une localisation non listée', () => {
            const prospect: ProspectForMatching = { location: 'New York' };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(false);
        });
    });

    describe('logique OR (au moins un critère)', () => {
        it('retourne true si UN seul critère matche', () => {
            const prospect: ProspectForMatching = {
                industry: 'Finance',    // no match
                companySize: '500+',    // no match
                role: 'Intern',         // no match
                location: 'France',     // MATCH
            };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(true);
        });

        it('retourne false si AUCUN critère ne matche', () => {
            const prospect: ProspectForMatching = {
                industry: 'Finance',
                companySize: '500+',
                role: 'Intern',
                location: 'Germany',
            };
            expect(matchesIcp(prospect, baseIcpConfig)).toBe(false);
        });
    });
});
