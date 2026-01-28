/**
 * Email Validation Tests
 * Story 3.2: CSV Import with Source Tracking & Validation
 */
import { describe, it, expect } from 'vitest';
import { EMAIL_REGEX, isRiskySource, autoMapColumnName } from '@/types/prospect';
import { isValidEmail } from '@/lib/import/csv-validator';

describe('Email Validation', () => {
    describe('EMAIL_REGEX', () => {
        const validEmails = [
            'test@example.com',
            'Test.User@Example.COM',
            'user+tag@domain.co.uk',
            'first.last@subdomain.domain.org',
            'user123@test.fr',
            'a@b.co',
        ];

        const invalidEmails = [
            '',
            'notanemail',
            '@nodomain.com',
            'no@',
            'spaces in@email.com',
            'double@@at.com',
        ];

        validEmails.forEach((email) => {
            it(`should accept valid email: ${email}`, () => {
                expect(EMAIL_REGEX.test(email)).toBe(true);
            });
        });

        invalidEmails.forEach((email) => {
            it(`should reject invalid email: ${email}`, () => {
                expect(EMAIL_REGEX.test(email)).toBe(false);
            });
        });
    });

    describe('isValidEmail', () => {
        it('should return true for valid emails', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
        });

        it('should return false for invalid emails', () => {
            expect(isValidEmail('invalid')).toBe(false);
        });
    });
});

describe('Source Validation', () => {
    describe('isRiskySource', () => {
        it('should flag purchased/bought keywords', () => {
            expect(isRiskySource('Purchased from vendor')).toBe(true);
            expect(isRiskySource('bought list')).toBe(true);
            expect(isRiskySource('Liste achetée')).toBe(true);
        });

        it('should flag unknown source', () => {
            expect(isRiskySource('Unknown origin')).toBe(true);
            expect(isRiskySource('Source inconnue')).toBe(true);
        });

        it('should flag paid lists', () => {
            expect(isRiskySource('Paid data provider')).toBe(true);
        });

        it('should not flag legitimate sources', () => {
            expect(isRiskySource('Conference Paris Tech 2026')).toBe(false);
            expect(isRiskySource('Webinar attendees')).toBe(false);
            expect(isRiskySource('CRM export')).toBe(false);
        });
    });
});

describe('Column Name Mapping', () => {
    describe('autoMapColumnName', () => {
        it('should map email variations', () => {
            expect(autoMapColumnName('email')).toBe('email');
            expect(autoMapColumnName('Email')).toBe('email');
            expect(autoMapColumnName('e-mail')).toBe('email');
            expect(autoMapColumnName('courriel')).toBe('email');
        });

        it('should map French first name variations', () => {
            expect(autoMapColumnName('prénom')).toBe('firstName');
            expect(autoMapColumnName('prenom')).toBe('firstName');
            expect(autoMapColumnName('Prénom')).toBe('firstName');
        });

        it('should map company variations', () => {
            expect(autoMapColumnName('company')).toBe('company');
            expect(autoMapColumnName('entreprise')).toBe('company');
            expect(autoMapColumnName('société')).toBe('company');
        });

        it('should return null for unknown columns', () => {
            expect(autoMapColumnName('custom_field')).toBeNull();
            expect(autoMapColumnName('random')).toBeNull();
        });
    });
});
