/**
 * Unit Tests for Preview Renderer
 * Story 4.5: Copilot Email Preview (Mandatory)
 * Task 9: Create Unit Tests
 *
 * Tests:
 * - Variable replacement
 * - Missing variable detection
 * - Unknown variable handling
 * - Email preview rendering
 */

import { describe, it, expect } from 'vitest';
import {
    renderPreview,
    renderEmailPreview,
    countPreviewWarnings,
    type PreviewProspect,
} from '@/lib/sequences/preview-renderer';

// Sample prospect data for testing
const sampleProspect: PreviewProspect = {
    firstName: 'Sophie',
    lastName: 'Martin',
    company: 'TechCorp',
    title: 'Directrice',
    email: 'sophie@techcorp.fr',
};

const incompleteProspect: PreviewProspect = {
    firstName: 'Jean',
    lastName: null,
    company: null,
    title: null,
    email: 'jean@example.com',
};

describe('renderPreview', () => {
    describe('Variable Replacement', () => {
        it('should replace all known variables with prospect data', () => {
            const content = 'Bonjour {{first_name}} {{last_name}}, bienvenue chez {{company}}.';
            const result = renderPreview(content, sampleProspect);

            expect(result.rendered).toBe('Bonjour Sophie Martin, bienvenue chez TechCorp.');
            expect(result.missingVariables).toHaveLength(0);
        });

        it('should handle title and email variables', () => {
            const content = '{{first_name}}, {{title}} at {{email}}';
            const result = renderPreview(content, sampleProspect);

            expect(result.rendered).toBe('Sophie, Directrice at sophie@techcorp.fr');
            expect(result.missingVariables).toHaveLength(0);
        });

        it('should be case-insensitive for variable names', () => {
            const content = '{{FIRST_NAME}} {{Last_Name}} {{COMPANY}}';
            const result = renderPreview(content, sampleProspect);

            expect(result.rendered).toBe('Sophie Martin TechCorp');
            expect(result.missingVariables).toHaveLength(0);
        });

        it('should handle content with no variables', () => {
            const content = 'Bonjour, ceci est un message sans variables.';
            const result = renderPreview(content, sampleProspect);

            expect(result.rendered).toBe('Bonjour, ceci est un message sans variables.');
            expect(result.missingVariables).toHaveLength(0);
        });

        it('should handle empty content', () => {
            const result = renderPreview('', sampleProspect);

            expect(result.rendered).toBe('');
            expect(result.missingVariables).toHaveLength(0);
        });
    });

    describe('Missing Variable Detection', () => {
        it('should detect missing variables when prospect data is null', () => {
            const content = 'Bonjour {{first_name}}, votre entreprise {{company}}.';
            const result = renderPreview(content, incompleteProspect);

            expect(result.rendered).toBe('Bonjour Jean, votre entreprise .');
            expect(result.missingVariables).toContain('company');
            expect(result.missingVariables).toHaveLength(1);
        });

        it('should detect multiple missing variables', () => {
            const content = '{{first_name}} {{last_name}} - {{title}} at {{company}}';
            const result = renderPreview(content, incompleteProspect);

            expect(result.missingVariables).toContain('last_name');
            expect(result.missingVariables).toContain('title');
            expect(result.missingVariables).toContain('company');
            expect(result.missingVariables).toHaveLength(3);
        });

        it('should not duplicate missing variables in the list', () => {
            const content = '{{company}} - {{company}} - {{company}}';
            const result = renderPreview(content, incompleteProspect);

            expect(result.missingVariables).toHaveLength(1);
            expect(result.missingVariables).toContain('company');
        });

        it('should replace missing variables with empty string', () => {
            const content = 'Hello {{company}}!';
            const result = renderPreview(content, incompleteProspect);

            expect(result.rendered).toBe('Hello !');
        });
    });

    describe('Unknown Variable Handling', () => {
        it('should leave unknown variables in place', () => {
            const content = 'Hello {{unknown_var}}, your {{another_unknown}}.';
            const result = renderPreview(content, sampleProspect);

            expect(result.rendered).toBe('Hello {{unknown_var}}, your {{another_unknown}}.');
            expect(result.missingVariables).toContain('unknown_var');
            expect(result.missingVariables).toContain('another_unknown');
        });

        it('should handle mix of known, missing, and unknown variables', () => {
            const content = '{{first_name}}, {{unknown}}, {{company}}';
            const result = renderPreview(content, incompleteProspect);

            expect(result.rendered).toBe('Jean, {{unknown}}, ');
            expect(result.missingVariables).toContain('unknown');
            expect(result.missingVariables).toContain('company');
        });
    });
});

describe('renderEmailPreview', () => {
    it('should render both subject and body', () => {
        const subject = 'Bonjour {{first_name}}';
        const body = '<p>Bienvenue chez {{company}}, {{title}}.</p>';
        const result = renderEmailPreview(subject, body, sampleProspect);

        expect(result.subject.rendered).toBe('Bonjour Sophie');
        expect(result.body.rendered).toBe('<p>Bienvenue chez TechCorp, Directrice.</p>');
        expect(result.totalMissingVariables).toHaveLength(0);
    });

    it('should combine missing variables from subject and body', () => {
        const subject = '{{first_name}} - {{company}}';
        const body = '{{title}} at {{company}}';
        const result = renderEmailPreview(subject, body, incompleteProspect);

        expect(result.subject.missingVariables).toContain('company');
        expect(result.body.missingVariables).toContain('company');
        expect(result.body.missingVariables).toContain('title');
        // totalMissingVariables should be unique
        expect(result.totalMissingVariables).toContain('company');
        expect(result.totalMissingVariables).toContain('title');
        expect(result.totalMissingVariables).toHaveLength(2);
    });

    it('should handle empty subject and body', () => {
        const result = renderEmailPreview('', '', sampleProspect);

        expect(result.subject.rendered).toBe('');
        expect(result.body.rendered).toBe('');
        expect(result.totalMissingVariables).toHaveLength(0);
    });
});

describe('countPreviewWarnings', () => {
    it('should count total warnings across previews', () => {
        const previews = [
            { missingVariables: ['company', 'title'] },
            { missingVariables: ['company'] },
            { missingVariables: [] },
        ];

        expect(countPreviewWarnings(previews)).toBe(3);
    });

    it('should return 0 for empty previews', () => {
        expect(countPreviewWarnings([])).toBe(0);
    });

    it('should return 0 when no warnings', () => {
        const previews = [
            { missingVariables: [] },
            { missingVariables: [] },
        ];

        expect(countPreviewWarnings(previews)).toBe(0);
    });
});
