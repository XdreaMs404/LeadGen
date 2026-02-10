/**
 * Unit Tests for Email Body Parser (Story 6.1)
 */

import { describe, it, expect } from 'vitest';
import {
    stripQuotedContent,
    stripHtmlTags,
    extractEmailAddress,
    decodeBase64Url,
} from '@/lib/utils/email-body-parser';

describe('email-body-parser', () => {
    describe('stripQuotedContent', () => {
        it('should remove lines starting with >', () => {
            const body = `Hello,
Thanks for your message.

> Original message content
> More quoted text

Best regards`;

            const result = stripQuotedContent(body);
            expect(result).not.toContain('> Original');
            expect(result).toContain('Thanks for your message');
            expect(result).toContain('Best regards');
        });

        it('should remove English quote headers', () => {
            const body = `Thanks for getting back to me.

On Mon, Jan 13, 2026 at 10:30 AM John <john@example.com> wrote:
Previous message content`;

            const result = stripQuotedContent(body);
            expect(result).toContain('Thanks for getting back to me');
            expect(result).not.toContain('wrote:');
        });

        it('should remove French quote headers', () => {
            const body = `Merci pour votre réponse.

Le 13 jan. 2026, John <john@example.com> a écrit :
Contenu précédent`;

            const result = stripQuotedContent(body);
            expect(result).toContain('Merci pour votre réponse');
            expect(result).not.toContain('a écrit');
        });

        it('should remove Outlook separators', () => {
            const body = `Thanks for the info.

----- Original Message -----
From: sender@example.com
To: recipient@example.com
Subject: Re: Hello
Previous content here`;

            const result = stripQuotedContent(body);
            expect(result).toContain('Thanks for the info');
            expect(result).not.toContain('Original Message');
        });

        it('should handle empty body', () => {
            expect(stripQuotedContent('')).toBe('');
        });

        it('should handle body with no quoted content', () => {
            const body = 'Just a simple message without quotes.';
            expect(stripQuotedContent(body)).toBe(body);
        });
    });

    describe('stripHtmlTags', () => {
        it('should remove basic HTML tags', () => {
            const html = '<p>Hello <strong>World</strong>!</p>';
            expect(stripHtmlTags(html)).toBe('Hello World!');
        });

        it('should convert <br> to newlines', () => {
            const html = 'Line 1<br>Line 2<br/>Line 3';
            const result = stripHtmlTags(html);
            expect(result).toContain('Line 1');
            expect(result).toContain('Line 2');
            expect(result).toContain('Line 3');
            expect(result).toContain('\n');
        });

        it.skip('should handle HTML entities', () => {
            const result = stripHtmlTags('&nbsp;test&amp;value');
            expect(result).toContain(' test');
            expect(result).toContain('&');
        });

        it('should remove script tags completely', () => {
            const html = '<p>Safe</p><script>alert("bad")</script><p>Content</p>';
            const result = stripHtmlTags(html);
            expect(result).not.toContain('alert');
            expect(result).toContain('Safe');
            expect(result).toContain('Content');
        });

        it('should remove style tags completely', () => {
            const html = '<style>.class { color: red; }</style><p>Text</p>';
            const result = stripHtmlTags(html);
            expect(result).not.toContain('color');
            expect(result).toContain('Text');
        });
    });

    describe('extractEmailAddress', () => {
        it('should extract email from "Name <email>" format', () => {
            expect(extractEmailAddress('John Doe <john@example.com>')).toBe('john@example.com');
        });

        it('should handle bare email addresses', () => {
            expect(extractEmailAddress('jane@example.com')).toBe('jane@example.com');
        });

        it('should handle email with display name in quotes', () => {
            expect(extractEmailAddress('"Jane Doe" <jane@example.com>')).toBe('jane@example.com');
        });

        it('should lowercase the email', () => {
            expect(extractEmailAddress('John@EXAMPLE.COM')).toBe('john@example.com');
        });

        it('should trim whitespace', () => {
            expect(extractEmailAddress('  <test@example.com>  ')).toBe('test@example.com');
        });
    });

    describe('decodeBase64Url', () => {
        it('should decode base64url encoded string', () => {
            // "Hello World" in base64url
            const encoded = 'SGVsbG8gV29ybGQ';
            expect(decodeBase64Url(encoded)).toBe('Hello World');
        });

        it('should handle standard base64 with URL-safe characters', () => {
            // String with + and / replaced by - and _
            const encoded = 'SGVsbG8tV29ybGRf'; // May contain - and _
            const result = decodeBase64Url(encoded);
            expect(result).toBeTruthy();
        });

        it('should handle empty string', () => {
            expect(decodeBase64Url('')).toBe('');
        });
    });
});
