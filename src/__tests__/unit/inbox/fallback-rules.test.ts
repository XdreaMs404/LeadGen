import { describe, expect, it } from 'vitest';
import { classifyByRules } from '@/lib/inbox/classification/fallback-rules';

describe('classifyByRules', () => {
    it('detects OUT_OF_OFFICE keywords in English and French', () => {
        expect(classifyByRules('I am out of office until Monday', '')?.classification).toBe('OUT_OF_OFFICE');
        expect(classifyByRules('Je suis en vacances cette semaine', '')?.classification).toBe('OUT_OF_OFFICE');
    });

    it('detects UNSUBSCRIBE keywords in English and French', () => {
        expect(classifyByRules('Please unsubscribe me from this list', '')?.classification).toBe('UNSUBSCRIBE');
        expect(classifyByRules('Merci de me désabonner', '')?.classification).toBe('UNSUBSCRIBE');
    });

    it('detects BOUNCE patterns', () => {
        expect(classifyByRules('Mail Delivery Subsystem: message not delivered', '')?.classification).toBe('BOUNCE');
        expect(classifyByRules('Permanent error: user unknown', '')?.classification).toBe('BOUNCE');
    });

    it('returns null when no pattern matches', () => {
        expect(classifyByRules('Bonjour, merci pour votre email.', 'Question')).toBeNull();
    });

    it('is case-insensitive', () => {
        expect(classifyByRules('OUT OF OFFICE', '')?.classification).toBe('OUT_OF_OFFICE');
        expect(classifyByRules('UNSUBSCRIBE', '')?.classification).toBe('UNSUBSCRIBE');
    });

    it('matches subject-only patterns', () => {
        expect(classifyByRules('', 'Automatic Reply: out of office')?.classification).toBe('OUT_OF_OFFICE');
        expect(classifyByRules('', 'Mail Delivery Subsystem')?.classification).toBe('BOUNCE');
    });
});
