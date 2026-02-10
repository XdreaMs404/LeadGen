/**
 * Email Composition Service
 * Story 5.5: Gmail API Email Sending with Threading
 * 
 * Composes RFC 2822 formatted emails with proper headers for Gmail API
 */

import { base64urlEncode } from './sender';
import { renderTemplate } from '@/lib/template/render-variables';
import type { Prospect, SequenceStep } from '@prisma/client';

/**
 * Encode a string with RFC 2047 for email headers with non-ASCII characters
 * Uses Base64 encoding with UTF-8 charset
 */
function encodeRfc2047(text: string): string {
    // Check if text contains non-ASCII characters
    if (!/[^\x00-\x7F]/.test(text)) {
        return text; // No encoding needed for ASCII-only text
    }

    // Encode as UTF-8 Base64 with RFC 2047 format: =?charset?encoding?encoded_text?=
    const base64 = Buffer.from(text, 'utf-8').toString('base64');
    return `=?UTF-8?B?${base64}?=`;
}

/**
 * Convert plain text newlines to HTML br tags
 */
function textToHtml(text: string): string {
    return text
        .replace(/\r\n/g, '<br>')
        .replace(/\n/g, '<br>')
        .replace(/\r/g, '<br>');
}

/**
 * Parameters for composing an email
 */
export interface ComposeEmailParams {
    /** Sender email address */
    from: string;
    /** Sender display name (optional) */
    fromName?: string;
    /** Recipient email address */
    to: string;
    /** Email subject */
    subject: string;
    /** Email body (HTML) */
    body: string;
    /** Signature to append (HTML) */
    signature?: string;
    /** Unsubscribe link HTML */
    unsubscribeLink?: string;
    /** For threading: In-Reply-To header (Message-ID of original email) */
    inReplyTo?: string;
    /** For threading: References header (Message-ID chain) */
    references?: string;
}

/**
 * Thread context from previous emails
 */
export interface ThreadContext {
    /** Gmail thread ID */
    threadId: string;
    /** In-Reply-To header value */
    inReplyTo: string;
    /** References header value */
    references: string;
    /** Original subject for Re: prefix */
    originalSubject: string;
}

/**
 * Parameters for rendering email body
 */
export interface RenderEmailBodyParams {
    /** Sequence step with subject and body template */
    step: Pick<SequenceStep, 'subject' | 'body'>;
    /** Prospect data for variable substitution */
    prospect: Pick<Prospect, 'firstName' | 'lastName' | 'company' | 'title' | 'email'>;
    /** Cached opener text (replaces {{opener}} if present) */
    openerCache?: string;
    /** Signature HTML to append */
    signature?: string;
    /** Whether this is for final send (true) or preview (false) */
    forSend?: boolean;
}

/**
 * Compose an RFC 2822 formatted email message
 * 
 * @param params - Email composition parameters
 * @returns Base64url encoded RFC 2822 email string ready for Gmail API
 */
export function composeEmail(params: ComposeEmailParams): string {
    const {
        from,
        fromName,
        to,
        subject,
        body,
        signature,
        unsubscribeLink,
        inReplyTo,
        references,
    } = params;

    // Build header lines
    const headers: string[] = [];

    // From header with optional display name
    if (fromName) {
        headers.push(`From: "${fromName}" <${from}>`);
    } else {
        headers.push(`From: ${from}`);
    }

    headers.push(`To: ${to}`);
    headers.push(`Subject: ${encodeRfc2047(subject)}`);
    headers.push(`Date: ${new Date().toUTCString()}`);
    headers.push('MIME-Version: 1.0');
    headers.push('Content-Type: text/html; charset=utf-8');

    // Threading headers for follow-up emails
    if (inReplyTo) {
        headers.push(`In-Reply-To: ${inReplyTo}`);
    }
    if (references) {
        headers.push(`References: ${references}`);
    }

    // Build body with optional signature and unsubscribe link
    let fullBody = body;

    if (signature) {
        // Convert signature newlines to HTML br tags
        const htmlSignature = textToHtml(signature);
        fullBody += '\n<br><br>--<br>\n' + htmlSignature;
    }

    if (unsubscribeLink) {
        fullBody += '\n<br><br>\n' + unsubscribeLink;
    }

    // Combine headers and body with CRLF line endings (RFC 2822)
    const rawEmail = headers.join('\r\n') + '\r\n\r\n' + fullBody;

    // Return base64url encoded for Gmail API
    return base64urlEncode(rawEmail);
}

/**
 * Render email body with template variable substitution
 * 
 * @param params - Render parameters
 * @returns Rendered email body HTML
 */
export function renderEmailBody(params: RenderEmailBodyParams): {
    subject: string;
    body: string;
} {
    const { step, prospect, openerCache, signature, forSend = true } = params;

    // Prepare prospect data for template rendering
    const prospectData = {
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        company: prospect.company,
        title: prospect.title,
        email: prospect.email,
    };

    // Render subject with variables
    const subjectResult = renderTemplate(step.subject, prospectData, {
        highlightMissing: !forSend,
    });

    // Render body with variables
    let bodyTemplate = step.body;

    // Replace {{opener}} with cached opener if present
    if (openerCache && bodyTemplate.includes('{{opener}}')) {
        bodyTemplate = bodyTemplate.replace(/\{\{opener\}\}/gi, openerCache);
    }

    const bodyResult = renderTemplate(bodyTemplate, prospectData, {
        highlightMissing: !forSend,
    });

    // Build full body with signature
    let fullBody = bodyResult.html;
    if (signature && forSend) {
        // Convert signature newlines to HTML br tags
        const htmlSignature = textToHtml(signature);
        fullBody += '\n<br><br>--<br>\n' + htmlSignature;
    }

    return {
        subject: subjectResult.html,
        body: fullBody,
    };
}

/**
 * Generate subject with Re: prefix for threading
 * 
 * @param originalSubject - Original email subject
 * @param addPrefix - Whether to add Re: prefix
 * @returns Subject with appropriate prefixing
 */
export function getThreadedSubject(originalSubject: string, addPrefix: boolean = true): string {
    if (!addPrefix) {
        return originalSubject;
    }

    // Check if subject already has Re: prefix (case-insensitive)
    if (/^Re:/i.test(originalSubject)) {
        return originalSubject;
    }

    return `Re: ${originalSubject}`;
}

/**
 * Generate unsubscribe link HTML
 * 
 * @param prospectId - Prospect ID for tracking
 * @param workspaceId - Workspace ID for routing
 * @returns HTML string with unsubscribe link
 */
export function generateUnsubscribeLink(
    prospectId: string,
    workspaceId: string
): string {
    // Generate unsubscribe URL (will be processed by the unsubscribe handler)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?p=${prospectId}&w=${workspaceId}`;

    return `<p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
        <a href="${unsubscribeUrl}" style="color: #6b7280;">Se désabonner</a>
    </p>`;
}

/**
 * Build full email headers as JSON for storage
 */
export function buildHeadersJson(params: {
    from: string;
    to: string;
    subject: string;
    messageId?: string;
    inReplyTo?: string;
    references?: string;
}): Record<string, string> {
    const headers: Record<string, string> = {
        From: params.from,
        To: params.to,
        Subject: params.subject,
        Date: new Date().toISOString(),
    };

    if (params.messageId) {
        headers['Message-ID'] = params.messageId;
    }
    if (params.inReplyTo) {
        headers['In-Reply-To'] = params.inReplyTo;
    }
    if (params.references) {
        headers['References'] = params.references;
    }

    return headers;
}
