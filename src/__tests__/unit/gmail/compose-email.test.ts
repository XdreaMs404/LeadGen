/**
 * Unit Tests: Email Composition Service
 * Story 5.5: Gmail API Email Sending with Threading
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    composeEmail,
    renderEmailBody,
    getThreadedSubject,
    generateUnsubscribeLink,
    buildHeadersJson,
} from '@/lib/gmail/compose-email';

// Mock the base64url encoder
vi.mock('@/lib/gmail/sender', () => ({
    base64urlEncode: (str: string) => Buffer.from(str).toString('base64'),
}));

// Mock template renderer
vi.mock('@/lib/template/render-variables', () => ({
    renderTemplate: (template: string, prospect: any) => {
        // Simple mock that replaces {{first_name}} with actual value
        const rendered = template
            .replace(/\{\{first_name\}\}/gi, prospect.firstName || '')
            .replace(/\{\{last_name\}\}/gi, prospect.lastName || '')
            .replace(/\{\{company\}\}/gi, prospect.company || '');
        return { html: rendered, text: rendered, missingFields: [], invalidVariables: [] };
    },
}));

describe('composeEmail', () => {
    it('composes a basic email in RFC 2822 format', () => {
        const result = composeEmail({
            from: 'sender@example.com',
            to: 'recipient@example.com',
            subject: 'Test Subject',
            body: '<p>Hello World</p>',
        });

        // Result is base64 encoded
        const decoded = Buffer.from(result, 'base64').toString();

        expect(decoded).toContain('From: sender@example.com');
        expect(decoded).toContain('To: recipient@example.com');
        expect(decoded).toContain('Subject: Test Subject');
        expect(decoded).toContain('MIME-Version: 1.0');
        expect(decoded).toContain('Content-Type: text/html; charset=utf-8');
        expect(decoded).toContain('<p>Hello World</p>');
    });

    it('includes display name in From header', () => {
        const result = composeEmail({
            from: 'sender@example.com',
            fromName: 'John Doe',
            to: 'recipient@example.com',
            subject: 'Test',
            body: 'Body',
        });

        const decoded = Buffer.from(result, 'base64').toString();
        expect(decoded).toContain('From: "John Doe" <sender@example.com>');
    });

    it('includes threading headers for follow-ups', () => {
        const result = composeEmail({
            from: 'sender@example.com',
            to: 'recipient@example.com',
            subject: 'Re: Original Subject',
            body: 'Follow-up body',
            inReplyTo: '<original-message-id@mail.gmail.com>',
            references: '<original-message-id@mail.gmail.com>',
        });

        const decoded = Buffer.from(result, 'base64').toString();
        expect(decoded).toContain('In-Reply-To: <original-message-id@mail.gmail.com>');
        expect(decoded).toContain('References: <original-message-id@mail.gmail.com>');
    });

    it('appends signature when provided', () => {
        const result = composeEmail({
            from: 'sender@example.com',
            to: 'recipient@example.com',
            subject: 'Test',
            body: '<p>Main content</p>',
            signature: '<p>Best regards,<br>John</p>',
        });

        const decoded = Buffer.from(result, 'base64').toString();
        expect(decoded).toContain('<p>Main content</p>');
        expect(decoded).toContain('--');
        expect(decoded).toContain('<p>Best regards,<br>John</p>');
    });

    it('appends unsubscribe link when provided', () => {
        const result = composeEmail({
            from: 'sender@example.com',
            to: 'recipient@example.com',
            subject: 'Test',
            body: '<p>Content</p>',
            unsubscribeLink: '<a href="#">Unsubscribe</a>',
        });

        const decoded = Buffer.from(result, 'base64').toString();
        expect(decoded).toContain('<a href="#">Unsubscribe</a>');
    });
});

describe('renderEmailBody', () => {
    const mockStep = {
        subject: 'Hello {{first_name}}',
        body: '<p>Dear {{first_name}} from {{company}},</p>',
    };

    const mockProspect = {
        firstName: 'Marie',
        lastName: 'Dupont',
        company: 'Acme Corp',
        title: 'CEO',
        email: 'marie@acme.com',
    };

    it('renders template variables in subject and body', () => {
        const result = renderEmailBody({
            step: mockStep,
            prospect: mockProspect,
            forSend: true,
        });

        expect(result.subject).toBe('Hello Marie');
        expect(result.body).toContain('Dear Marie from Acme Corp,');
    });

    it('replaces {{opener}} with cached opener', () => {
        const step = {
            subject: 'Hey',
            body: '<p>{{opener}}</p><p>Rest of email</p>',
        };

        const result = renderEmailBody({
            step,
            prospect: mockProspect,
            openerCache: 'I loved your recent presentation!',
            forSend: true,
        });

        expect(result.body).toContain('I loved your recent presentation!');
        expect(result.body).not.toContain('{{opener}}');
    });
});

describe('getThreadedSubject', () => {
    it('adds Re: prefix to original subject', () => {
        expect(getThreadedSubject('Hello World')).toBe('Re: Hello World');
    });

    it('does not double Re: prefix', () => {
        expect(getThreadedSubject('Re: Hello World')).toBe('Re: Hello World');
    });

    it('handles case-insensitive Re: prefix', () => {
        expect(getThreadedSubject('RE: Hello World')).toBe('RE: Hello World');
        expect(getThreadedSubject('re: Hello World')).toBe('re: Hello World');
    });

    it('respects addPrefix flag', () => {
        expect(getThreadedSubject('Hello World', false)).toBe('Hello World');
    });
});

describe('generateUnsubscribeLink', () => {
    beforeEach(() => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    });

    it('generates correct unsubscribe URL', () => {
        const result = generateUnsubscribeLink('prospect-123', 'workspace-456');

        expect(result).toContain('href="https://app.example.com/api/unsubscribe?p=prospect-123&w=workspace-456"');
        expect(result).toContain('Se désabonner');
    });

    it('uses localhost when no APP_URL configured', () => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', '');

        const result = generateUnsubscribeLink('p1', 'w1');
        expect(result).toContain('localhost:3000');
    });
});

describe('buildHeadersJson', () => {
    it('builds headers object with all fields', () => {
        const headers = buildHeadersJson({
            from: 'sender@example.com',
            to: 'recipient@example.com',
            subject: 'Test Subject',
            messageId: 'msg-123',
            inReplyTo: '<original@mail.gmail.com>',
            references: '<original@mail.gmail.com>',
        });

        expect(headers.From).toBe('sender@example.com');
        expect(headers.To).toBe('recipient@example.com');
        expect(headers.Subject).toBe('Test Subject');
        expect(headers['Message-ID']).toBe('msg-123');
        expect(headers['In-Reply-To']).toBe('<original@mail.gmail.com>');
        expect(headers['References']).toBe('<original@mail.gmail.com>');
        expect(headers.Date).toBeDefined();
    });

    it('omits optional fields when not provided', () => {
        const headers = buildHeadersJson({
            from: 'sender@example.com',
            to: 'recipient@example.com',
            subject: 'Test',
        });

        expect(headers['Message-ID']).toBeUndefined();
        expect(headers['In-Reply-To']).toBeUndefined();
        expect(headers['References']).toBeUndefined();
    });
});
