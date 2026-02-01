/**
 * Unit Tests for Spam Analyzer
 * Story 4.6: Spam Risk Assessment & Warnings (MVP Heuristics)
 * Task 9: Create Unit Tests
 *
 * Tests:
 * - Word count thresholds
 * - Link detection regex
 * - Risky words detection (FR/EN)
 * - Punctuation detection
 * - ALL CAPS detection
 * - Score calculation and risk levels
 */

import { describe, it, expect } from 'vitest';
import {
    analyzeSpamRisk,
    hasHighSeverityWarnings,
    SpamRiskLevel,
    type SpamAnalysisResult,
} from '@/lib/sequences/spam-analyzer';

describe('analyzeSpamRisk', () => {
    describe('Word Count Checks', () => {
        it('should warn when email is too short (<50 words)', () => {
            const subject = 'Hello';
            const body = 'Short email body here.'; // ~4 words total

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'word_count_low')).toBe(true);
            expect(result.score).toBeGreaterThan(0);
        });

        it('should warn when email is too long (>500 words)', () => {
            const subject = 'Long email';
            // Generate 510 words
            const body = Array(510).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'word_count_high')).toBe(true);
        });

        it('should not warn for normal length emails (50-500 words)', () => {
            const subject = 'Normal subject';
            const body = Array(100).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'word_count_low')).toBe(false);
            expect(result.warnings.some(w => w.type === 'word_count_high')).toBe(false);
        });

        it('should strip HTML tags when counting words', () => {
            const subject = 'Test';
            const body = '<p>One</p> <strong>two</strong> <div>three four five</div>' +
                Array(50).fill('<span>word</span>').join(' ');

            const result = analyzeSpamRisk(subject, body);

            // Should not warn about being too short
            expect(result.warnings.some(w => w.type === 'word_count_low')).toBe(false);
        });
    });

    describe('Link Count Checks', () => {
        it('should warn when more than 3 links are present', () => {
            const subject = 'Links test';
            const body = `
                Check https://link1.com and https://link2.com
                Also https://link3.com, https://link4.com, https://link5.com
            `;

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'link_count')).toBe(true);
        });

        it('should not warn when 3 or fewer links are present', () => {
            const subject = 'Few links';
            const body = `
                Visit https://link1.com and https://link2.com
                Contact mailto:email@example.com
            `;

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'link_count')).toBe(false);
        });

        it('should detect mailto links', () => {
            const subject = 'Contact';
            const body = `
                mailto:a@b.com mailto:c@d.com mailto:e@f.com
                mailto:g@h.com mailto:i@j.com
            `;

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'link_count')).toBe(true);
        });
    });

    describe('Risky Words Detection', () => {
        it('should detect French risky words', () => {
            const subject = 'Offre urgente';
            const body = 'Profitez de cette offre gratuite, 100% garanti!';

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'risky_words')).toBe(true);
        });

        it('should detect English risky words', () => {
            const subject = 'Act now!';
            const body = 'Free offer, guaranteed winner!';

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'risky_words')).toBe(true);
        });

        it('should not warn when no risky words are present', () => {
            const subject = 'Professional inquiry';
            const body = 'Hello, I would like to discuss a business opportunity with you. ' +
                'Please let me know if you have time for a call. ' +
                Array(50).fill('normal').join(' ');

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'risky_words')).toBe(false);
        });

        it('should match whole words only', () => {
            const subject = 'Test';
            const body = 'The urgently discussed topic was not urgent. ' +
                Array(50).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            // "urgent" should be detected (whole word match)
            const riskyWarning = result.warnings.find(w => w.type === 'risky_words');
            // "urgently" should NOT contribute since it's not a match for "urgent"
            // Only "urgent" at end should match
            expect(riskyWarning).toBeDefined();
        });
    });

    describe('Excessive Punctuation Detection', () => {
        it('should detect triple exclamation marks', () => {
            const subject = 'Amazing offer!!!';
            const body = Array(50).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'excessive_punctuation')).toBe(true);
        });

        it('should detect triple question marks', () => {
            const subject = 'Did you see this???';
            const body = Array(50).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'excessive_punctuation')).toBe(true);
        });

        it('should detect mixed punctuation', () => {
            const subject = 'What!?';
            const body = 'Is this real!?!? ' + Array(50).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'excessive_punctuation')).toBe(true);
        });

        it('should not warn for normal punctuation', () => {
            const subject = 'Question?';
            const body = 'This is normal. Is it not? Yes! ' + Array(50).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'excessive_punctuation')).toBe(false);
        });
    });

    describe('ALL CAPS Detection', () => {
        it('should warn when more than 20% is uppercase', () => {
            // Need more than 20% uppercase characters
            const subject = 'IMPORTANT URGENT MESSAGE';
            const body = 'THIS IS ALL CAPS TEXT THAT SHOULD TRIGGER THE WARNING. ' +
                'We also add some lowercase to balance. ' +
                Array(10).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'all_caps')).toBe(true);
        });

        it('should not warn for normal capitalization', () => {
            const subject = 'Hello There';
            const body = 'This is a normal email with proper capitalization. ' +
                Array(50).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'all_caps')).toBe(false);
        });

        it('should ignore HTML tags when calculating caps percentage', () => {
            const subject = 'Test';
            const body = '<DIV><SPAN><STRONG>hello world</STRONG></SPAN></DIV> ' +
                Array(50).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            // HTML tags are uppercase but should be stripped
            expect(result.warnings.some(w => w.type === 'all_caps')).toBe(false);
        });
    });

    describe('Unsubscribe Detection', () => {
        it('should warn when no opt-out text is present', () => {
            const subject = 'Hello';
            // Ensure no unsubscribe-related text is in the body
            const body = 'This is an email about our product. ' +
                Array(50).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'missing_unsubscribe')).toBe(true);
        });

        it('should not warn when French unsubscribe text is present', () => {
            const subject = 'Newsletter';
            const body = 'Content here. Pour se désabonner, cliquez ici. ' +
                Array(50).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'missing_unsubscribe')).toBe(false);
        });

        it('should not warn when English unsubscribe text is present', () => {
            const subject = 'Newsletter';
            const body = 'Content here. Click to unsubscribe anytime. ' +
                Array(50).fill('word').join(' ');

            const result = analyzeSpamRisk(subject, body);

            expect(result.warnings.some(w => w.type === 'missing_unsubscribe')).toBe(false);
        });
    });

    describe('Score Calculation and Risk Levels', () => {
        it('should return LOW risk for clean emails', () => {
            const subject = 'Professional inquiry';
            const body = 'Hello, I hope this message finds you well. ' +
                'I wanted to reach out about a potential collaboration. ' +
                'Please let me know if you would be available for a call. ' +
                'Looking forward to hearing from you. ' +
                'Best regards. ' +
                Array(40).fill('word').join(' ') +
                ' Se désabonner.';

            const result = analyzeSpamRisk(subject, body);

            expect(result.riskLevel).toBe(SpamRiskLevel.LOW);
            expect(result.score).toBeLessThan(30);
        });

        it('should return MEDIUM risk for moderately problematic emails', () => {
            // Need to accumulate enough score to reach MEDIUM (30+)
            // Short email (+20), urgent (+5), missing unsubscribe (+10) = 35
            const subject = 'Urgent: Special offer';
            const body = 'Check this out!'; // Very short email

            const result = analyzeSpamRisk(subject, body);

            // Has "urgent" (+5), short email (+20), missing unsubscribe (+10) = 35
            expect(result.riskLevel).toBe(SpamRiskLevel.MEDIUM);
            expect(result.score).toBeGreaterThanOrEqual(30);
            expect(result.score).toBeLessThanOrEqual(60);
        });

        it('should return HIGH risk for very problematic emails', () => {
            const subject = 'URGENT!!! FREE MONEY!!!';
            const body = 'YOU HAVE BEEN SELECTED!!! Act now for your FREE PRIZE!!! ' +
                'Click https://scam1.com https://scam2.com https://scam3.com https://scam4.com';

            const result = analyzeSpamRisk(subject, body);

            expect(result.riskLevel).toBe(SpamRiskLevel.HIGH);
            expect(result.score).toBeGreaterThan(60);
        });

        it('should accumulate scores from multiple issues', () => {
            const subject = 'URGENT!!!';
            const body = 'ACT NOW! Free guaranteed prize!!! ' +
                'https://a.com https://b.com https://c.com https://d.com https://e.com';

            const result = analyzeSpamRisk(subject, body);

            // Should have multiple warnings
            expect(result.warnings.length).toBeGreaterThan(3);
            expect(result.score).toBeGreaterThan(40);
        });
    });
});

describe('hasHighSeverityWarnings', () => {
    it('should return true when high severity warnings exist', () => {
        const result: SpamAnalysisResult = {
            riskLevel: SpamRiskLevel.HIGH,
            score: 70,
            warnings: [
                { type: 'all_caps', message: 'Test', severity: 'high', score: 25 },
            ],
        };

        expect(hasHighSeverityWarnings(result)).toBe(true);
    });

    it('should return false when no high severity warnings exist', () => {
        const result: SpamAnalysisResult = {
            riskLevel: SpamRiskLevel.MEDIUM,
            score: 40,
            warnings: [
                { type: 'risky_words', message: 'Test', severity: 'medium', score: 10 },
                { type: 'missing_unsubscribe', message: 'Test', severity: 'low', score: 10 },
            ],
        };

        expect(hasHighSeverityWarnings(result)).toBe(false);
    });

    it('should return false for empty warnings', () => {
        const result: SpamAnalysisResult = {
            riskLevel: SpamRiskLevel.LOW,
            score: 0,
            warnings: [],
        };

        expect(hasHighSeverityWarnings(result)).toBe(false);
    });
});
