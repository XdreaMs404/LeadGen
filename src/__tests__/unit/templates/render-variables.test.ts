/**
 * Render Variables Tests
 * Tests for template rendering with prospect data.
 *
 * @module __tests__/unit/templates/render-variables.test
 * @story 4.3 Template Variables System with Picker
 */

import { describe, it, expect } from 'vitest';
import {
    renderTemplate,
    countMissingFieldsByProspect,
    type ProspectData,
} from '@/lib/template/render-variables';

const completeProspect: ProspectData = {
    firstName: 'Marie',
    lastName: 'Dupont',
    company: 'TechCorp',
    title: 'Directrice',
    email: 'marie@techcorp.fr',
};

const partialProspect: ProspectData = {
    firstName: 'Jean',
    lastName: 'Martin',
    company: null,
    title: '',
    email: 'jean@example.fr',
};

describe('renderTemplate', () => {
    describe('with complete data', () => {
        it('should replace all variables with values', () => {
            const template = 'Bonjour {{first_name}} {{last_name}} de {{company}}';
            const result = renderTemplate(template, completeProspect);

            expect(result.html).toBe('Bonjour Marie Dupont de TechCorp');
            expect(result.text).toBe('Bonjour Marie Dupont de TechCorp');
            expect(result.missingFields).toHaveLength(0);
            expect(result.invalidVariables).toHaveLength(0);
        });

        it('should handle all supported variables', () => {
            const template = '{{first_name}}, {{last_name}}, {{company}}, {{title}}, {{email}}';
            const result = renderTemplate(template, completeProspect);

            expect(result.html).toBe('Marie, Dupont, TechCorp, Directrice, marie@techcorp.fr');
        });

        it('should handle case insensitive variable names', () => {
            const template = 'Hello {{FIRST_NAME}}';
            const result = renderTemplate(template, completeProspect);

            expect(result.html).toBe('Hello Marie');
        });
    });

    describe('with missing data', () => {
        it('should render empty for missing values (default mode)', () => {
            const template = 'Bonjour {{first_name}} de {{company}}';
            const result = renderTemplate(template, partialProspect);

            expect(result.html).toBe('Bonjour Jean de ');
            expect(result.missingFields).toContain('company');
        });

        it('should highlight missing values when option enabled', () => {
            const template = 'Contact at {{company}}';
            const result = renderTemplate(template, partialProspect, {
                highlightMissing: true,
            });

            expect(result.html).toContain('[vide]');
            expect(result.html).toContain('bg-amber');
            expect(result.missingFields).toContain('company');
        });

        it('should track empty string as missing', () => {
            const template = 'Your title: {{title}}';
            const result = renderTemplate(template, partialProspect);

            expect(result.missingFields).toContain('title');
        });

        it('should track null as missing', () => {
            const template = 'Company: {{company}}';
            const result = renderTemplate(template, partialProspect);

            expect(result.missingFields).toContain('company');
        });
    });

    describe('with invalid variables', () => {
        it('should keep invalid variables as-is', () => {
            const template = 'Hello {{first_name}} {{unknown_var}}';
            const result = renderTemplate(template, completeProspect);

            expect(result.html).toBe('Hello Marie {{unknown_var}}');
            expect(result.invalidVariables).toContain('unknown_var');
        });

        it('should report multiple invalid variables', () => {
            const template = '{{custom1}} and {{custom2}}';
            const result = renderTemplate(template, completeProspect);

            expect(result.invalidVariables).toHaveLength(2);
            expect(result.invalidVariables).toContain('custom1');
            expect(result.invalidVariables).toContain('custom2');
        });
    });

    describe('text output', () => {
        it('should strip HTML tags from rendered output', () => {
            const template = '<p>Bonjour {{first_name}}</p>';
            const result = renderTemplate(template, completeProspect);

            expect(result.html).toBe('<p>Bonjour Marie</p>');
            expect(result.text).toBe('Bonjour Marie');
        });

        it('should strip highlight markup from text output', () => {
            const template = '{{company}}';
            const result = renderTemplate(template, partialProspect, {
                highlightMissing: true,
            });

            expect(result.text).toBe('[vide]');
        });
    });

    describe('edge cases', () => {
        it('should handle template with no variables', () => {
            const result = renderTemplate('Just plain text', completeProspect);

            expect(result.html).toBe('Just plain text');
            expect(result.missingFields).toHaveLength(0);
        });

        it('should handle empty template', () => {
            const result = renderTemplate('', completeProspect);

            expect(result.html).toBe('');
        });

        it('should handle empty prospect', () => {
            const template = '{{first_name}} {{last_name}}';
            const result = renderTemplate(template, {});

            expect(result.missingFields).toHaveLength(2);
        });
    });
});

describe('countMissingFieldsByProspect', () => {
    it('should count prospects missing each field', () => {
        const template = '{{first_name}} at {{company}}';
        const prospects: ProspectData[] = [
            { firstName: 'A', lastName: null, company: null, title: null, email: null },
            { firstName: 'B', lastName: null, company: 'Corp', title: null, email: null },
            { firstName: null, lastName: null, company: null, title: null, email: null },
        ];

        const counts = countMissingFieldsByProspect(template, prospects);

        expect(counts.get('company')).toBe(2);
        expect(counts.get('first_name')).toBe(1);
    });

    it('should only count variables used in template', () => {
        const template = '{{first_name}} only';
        const prospects: ProspectData[] = [
            { firstName: 'A', lastName: null, company: null, title: null, email: null },
        ];

        const counts = countMissingFieldsByProspect(template, prospects);

        // company is missing but not used in template
        expect(counts.has('company')).toBe(false);
        expect(counts.has('first_name')).toBe(false); // not missing
    });

    it('should return empty map when no missing fields', () => {
        const template = '{{first_name}}';
        const prospects: ProspectData[] = [
            { firstName: 'A', lastName: null, company: null, title: null, email: null },
            { firstName: 'B', lastName: null, company: null, title: null, email: null },
        ];

        const counts = countMissingFieldsByProspect(template, prospects);

        expect(counts.size).toBe(0);
    });

    it('should handle template with no valid variables', () => {
        const template = '{{unknown}}';
        const prospects: ProspectData[] = [completeProspect];

        const counts = countMissingFieldsByProspect(template, prospects);

        expect(counts.size).toBe(0);
    });
});
