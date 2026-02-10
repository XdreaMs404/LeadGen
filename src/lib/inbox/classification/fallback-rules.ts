/**
 * Fallback Rule-Based Classifier (Story 6.4 AC1)
 * 
 * Applies pattern matching for known reply types BEFORE calling LLM.
 * Handles: OOO, UNSUBSCRIBE, BOUNCE patterns.
 * Bilingual: French + English keywords.
 */

import type { ReplyClassification } from '@prisma/client';

export interface ClassificationRuleResult {
    classification: ReplyClassification;
    confidence: number;
    method: 'RULE';
}

// ============================================================================
// Pattern Definitions (case-insensitive)
// ============================================================================

const OOO_PATTERNS: RegExp[] = [
    // English
    /out of office/i,
    /\bvacation\b/i,
    /\baway\b.*\b(from|until|till)\b/i,
    /\babsent\b/i,
    /\bon leave\b/i,
    /auto[\s-]?reply/i,
    /automatic reply/i,
    /currently unavailable/i,
    // French
    /\bcong[ée]\b/i,
    /\babsence\b/i,
    /\ben vacances?\b/i,
    /retour le\b/i,
    /de retour\b/i,
    /hors du bureau/i,
    /\babsent(e)?\b/i,
    /r[ée]ponse automatique/i,
];

const UNSUBSCRIBE_PATTERNS: RegExp[] = [
    // English
    /\bunsubscribe\b/i,
    /\bremove me\b/i,
    /\bstop contacting\b/i,
    /\bstop emailing\b/i,
    /\bdo not contact\b/i,
    /\bopt[\s-]?out\b/i,
    /\btake me off\b/i,
    /\bno longer interested\b/i,
    // French
    /\bd[ée]sabonner\b/i,
    /\bd[ée]sinscription\b/i,
    /ne plus recevoir/i,
    /ne m['']?[ée]crivez plus/i,
    /arr[êe]tez de m/i,
    /plus de mail/i,
    /retirez[\s-]moi/i,
    /supprimez[\s-]moi/i,
];

const BOUNCE_PATTERNS: RegExp[] = [
    /delivery fail/i,
    /permanent error/i,
    /\bmailer[\s-]?daemon\b/i,
    /\bundeliverable\b/i,
    /message not delivered/i,
    /mail delivery subsystem/i,
    /delivery status notification/i,
    /could not be delivered/i,
    /user unknown/i,
    /mailbox unavailable/i,
    /address rejected/i,
    /\bnon[\s-]?remis\b/i,
    /erreur de livraison/i,
];

// ============================================================================
// Classifier Function
// ============================================================================

/**
 * Classify a reply using rule-based pattern matching.
 * Returns null if no pattern matches (caller should fall through to LLM).
 * 
 * @param body - The email body text
 * @param subject - The email subject line
 * @returns ClassificationRuleResult or null if no match
 */
export function classifyByRules(
    body: string,
    subject: string
): ClassificationRuleResult | null {
    const text = `${subject} ${body}`.toLowerCase();

    // Check BOUNCE first (most specific — from system, not human)
    for (const pattern of BOUNCE_PATTERNS) {
        if (pattern.test(text)) {
            return { classification: 'BOUNCE', confidence: 100, method: 'RULE' };
        }
    }

    // Check OOO
    for (const pattern of OOO_PATTERNS) {
        if (pattern.test(text)) {
            return { classification: 'OUT_OF_OFFICE', confidence: 100, method: 'RULE' };
        }
    }

    // Check UNSUBSCRIBE
    for (const pattern of UNSUBSCRIBE_PATTERNS) {
        if (pattern.test(text)) {
            return { classification: 'UNSUBSCRIBE', confidence: 100, method: 'RULE' };
        }
    }

    return null;
}
