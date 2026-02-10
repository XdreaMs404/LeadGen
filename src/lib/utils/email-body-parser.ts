/**
 * Email Body Parser Utilities (Story 6.1)
 * 
 * Functions for extracting and cleaning email body content.
 */

/**
 * Patterns for detecting quoted content in email replies
 */
const QUOTED_PATTERNS = [
    // Lines starting with >
    /^>.*$/gm,
    // English quote header: "On <date>, <email> wrote:"
    /^On\s.+\swrote:\s*$/gm,
    // French quote header: "Le <date>, <email> a écrit :"
    /^Le\s.+\sa\s+écrit\s*:\s*$/gm,
    // Outlook separator
    /^-----\s*Original Message\s*-----[\s\S]*$/gm,
    // Underscore separator (10+ underscores)
    /^_{10,}[\s\S]*$/gm,
    // Gmail "On <date> at <time>" pattern
    /^On\s.+\sat\s.+wrote:\s*$/gm,
    // "From: <email>" header (often starts forwarded/quoted sections)
    /^From:\s.+$/gm,
    // "Sent from my iPhone/Android" signatures
    /^Sent from my (iPhone|Android|iPad|mobile).*/gm,
];

/**
 * Strip quoted content from email body
 * Removes previous replies and forwards to get clean reply content
 */
export function stripQuotedContent(body: string): string {
    let cleaned = body;

    // Apply each pattern
    for (const pattern of QUOTED_PATTERNS) {
        cleaned = cleaned.replace(pattern, '');
    }

    // Remove multiple consecutive blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
}

/**
 * Strip HTML tags and convert to plain text
 */
export function stripHtmlTags(html: string): string {
    // Remove script and style elements completely
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Replace common HTML entities
    text = text.replace(/&nbsp;/gi, ' ');
    text = text.replace(/&amp;/gi, '&');
    text = text.replace(/&lt;/gi, '<');
    text = text.replace(/&gt;/gi, '>');
    text = text.replace(/&quot;/gi, '"');
    text = text.replace(/&#39;/gi, "'");

    // Convert <br> and </p> to newlines
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<\/div>/gi, '\n');

    // Remove all remaining HTML tags
    text = text.replace(/<[^>]*>/g, '');

    // Clean up whitespace
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    return text;
}

/**
 * Extract email address from a From/To header
 * Handles formats like "Name <email@domain.com>" and "email@domain.com"
 */
export function extractEmailAddress(header: string): string {
    // Match email in angle brackets first
    const angleMatch = header.match(/<([^>]+)>/);
    if (angleMatch) {
        return angleMatch[1].trim().toLowerCase();
    }

    // Otherwise try to extract a bare email
    const emailMatch = header.match(/[\w.+-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
        return emailMatch[0].trim().toLowerCase();
    }

    // Return original as last resort
    return header.trim().toLowerCase();
}

/**
 * Decode base64url encoded string (used by Gmail API)
 */
export function decodeBase64Url(data: string): string {
    // Convert base64url to base64
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    // Decode
    try {
        return Buffer.from(padded, 'base64').toString('utf-8');
    } catch {
        console.error('[email-body-parser] Failed to decode base64url data');
        return '';
    }
}

/**
 * Parse MIME message part and extract body
 */
export function extractBodyFromMimePart(
    part: { mimeType?: string; body?: { data?: string }; parts?: unknown[] },
    preferPlain = true
): { raw: string; cleaned: string } | null {
    if (!part) return null;

    // Check if this is the desired MIME type
    if (part.mimeType === 'text/plain' && part.body?.data) {
        const raw = decodeBase64Url(part.body.data);
        return {
            raw,
            cleaned: stripQuotedContent(raw),
        };
    }

    if (!preferPlain && part.mimeType === 'text/html' && part.body?.data) {
        const html = decodeBase64Url(part.body.data);
        const raw = stripHtmlTags(html);
        return {
            raw,
            cleaned: stripQuotedContent(raw),
        };
    }

    // Recursively check nested parts
    if (part.parts && Array.isArray(part.parts)) {
        // First pass: look for text/plain
        if (preferPlain) {
            for (const subPart of part.parts) {
                const result = extractBodyFromMimePart(subPart as typeof part, true);
                if (result) return result;
            }
        }

        // Second pass: fall back to text/html
        for (const subPart of part.parts) {
            const result = extractBodyFromMimePart(subPart as typeof part, false);
            if (result) return result;
        }
    }

    return null;
}
