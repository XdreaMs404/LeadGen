/**
 * Spam Analyzer Service
 * Story 4.6: Spam Risk Assessment & Warnings (MVP Heuristics)
 * Task 1: Create Spam Analyzer Service
 * Task 2: Implement Heuristic Checks
 *
 * Analyzes email content for potential spam triggers using heuristics:
 * - Email length (word count)
 * - Link count
 * - Risky words detection
 * - Excessive punctuation
 * - ALL CAPS detection
 * - Unsubscribe footer detection
 */

import { SPAM_RISKY_WORDS, SPAM_THRESHOLDS } from '@/lib/constants/sequences';

// ============================================
// Types
// ============================================

export enum SpamRiskLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

export type SpamWarningSeverity = 'low' | 'medium' | 'high';
export type SpamWarningType =
    | 'word_count_low'
    | 'word_count_high'
    | 'link_count'
    | 'risky_words'
    | 'excessive_punctuation'
    | 'all_caps'
    | 'missing_unsubscribe';

export interface SpamWarning {
    type: SpamWarningType;
    message: string;
    severity: SpamWarningSeverity;
    score: number;
}

export interface SpamAnalysisResult {
    riskLevel: SpamRiskLevel;
    score: number;
    warnings: SpamWarning[];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Count words in text, ignoring HTML tags
 */
function countWords(text: string): number {
    // Strip HTML tags first
    const plainText = text.replace(/<[^>]*>/g, ' ');
    // Split by whitespace and filter empty strings
    const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
}

/**
 * Count links in text (http, https, mailto)
 */
function countLinks(text: string): number {
    const linkPattern = /https?:\/\/|mailto:/gi;
    const matches = text.match(linkPattern);
    return matches ? matches.length : 0;
}

/**
 * Find risky words in text
 */
function findRiskyWords(text: string): string[] {
    const lowerText = text.toLowerCase();
    const foundWords: string[] = [];

    for (const word of SPAM_RISKY_WORDS) {
        // Use word boundary to match whole words
        const pattern = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
        if (pattern.test(lowerText)) {
            foundWords.push(word);
        }
    }

    return foundWords;
}

/**
 * Check for excessive punctuation (!!!, ???, !!!???, etc.)
 */
function hasExcessivePunctuation(text: string): boolean {
    const excessivePattern = /[!?]{3,}|[!]+[?]+|[?]+[!]+/g;
    return excessivePattern.test(text);
}

/**
 * Calculate percentage of uppercase characters (excluding HTML tags)
 */
function calculateCapsPercentage(text: string): number {
    // Strip HTML tags
    const plainText = text.replace(/<[^>]*>/g, '');
    // Get only alphabetic characters
    const letters = plainText.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    if (letters.length === 0) return 0;

    const uppercaseCount = letters.replace(/[^A-ZÀ-Ý]/g, '').length;
    return (uppercaseCount / letters.length) * 100;
}

/**
 * Check if content has unsubscribe-related text
 */
function hasUnsubscribeText(text: string): boolean {
    const unsubscribePatterns = [
        /d[ée]sabonner/i,
        /unsubscribe/i,
        /se d[ée]sinscrire/i,
        /ne plus recevoir/i,
        /opt[- ]out/i,
        /lien de d[ée]sinscription/i,
    ];

    return unsubscribePatterns.some(pattern => pattern.test(text));
}

// ============================================
// Main Analysis Function
// ============================================

/**
 * Analyze email content for spam risk using MVP heuristics
 *
 * Scoring:
 * - Email too short (<50 words): +20
 * - Email too long (>500 words): +15
 * - Each link over 3: +10
 * - Each risky word found: +5
 * - Excessive punctuation (!!!, ???): +15
 * - ALL CAPS >20%: +25
 * - Missing unsubscribe mention: +10 (informational only)
 *
 * Risk Levels:
 * - LOW: score <30
 * - MEDIUM: score 30-60
 * - HIGH: score >60
 */
export function analyzeSpamRisk(subject: string, body: string): SpamAnalysisResult {
    const warnings: SpamWarning[] = [];
    let score = 0;

    // Combine subject and body for analysis
    const fullContent = `${subject} ${body}`;

    // 1. Check word count
    const wordCount = countWords(fullContent);
    if (wordCount < 50) {
        score += 20;
        warnings.push({
            type: 'word_count_low',
            message: `Email trop court (${wordCount} mots). Visez au moins 50 mots pour plus de crédibilité.`,
            severity: 'medium',
            score: 20,
        });
    } else if (wordCount > 500) {
        score += 15;
        warnings.push({
            type: 'word_count_high',
            message: `Email trop long (${wordCount} mots). Les emails de plus de 500 mots peuvent être ignorés.`,
            severity: 'low',
            score: 15,
        });
    }

    // 2. Check link count
    const linkCount = countLinks(fullContent);
    if (linkCount > 3) {
        const extraLinks = linkCount - 3;
        const linkScore = extraLinks * 10;
        score += linkScore;
        warnings.push({
            type: 'link_count',
            message: `Trop de liens (${linkCount}). Limitez à 3 liens maximum pour éviter les filtres spam.`,
            severity: linkCount > 5 ? 'high' : 'medium',
            score: linkScore,
        });
    }

    // 3. Check risky words
    const riskyWords = findRiskyWords(fullContent);
    if (riskyWords.length > 0) {
        const riskyScore = riskyWords.length * 5;
        score += riskyScore;
        warnings.push({
            type: 'risky_words',
            message: `Mots à risque détectés : "${riskyWords.slice(0, 3).join('", "')}${riskyWords.length > 3 ? '...' : ''}". Ces mots peuvent déclencher les filtres spam.`,
            severity: riskyWords.length > 3 ? 'medium' : 'low',
            score: riskyScore,
        });
    }

    // 4. Check excessive punctuation
    if (hasExcessivePunctuation(fullContent)) {
        score += 15;
        warnings.push({
            type: 'excessive_punctuation',
            message: 'Ponctuation excessive détectée (!!!, ???). Évitez les répétitions de ponctuation.',
            severity: 'medium',
            score: 15,
        });
    }

    // 5. Check ALL CAPS
    const capsPercentage = calculateCapsPercentage(fullContent);
    if (capsPercentage > 20) {
        score += 25;
        warnings.push({
            type: 'all_caps',
            message: `Trop de majuscules (${Math.round(capsPercentage)}%). Les emails en majuscules sont souvent filtrés.`,
            severity: 'high',
            score: 25,
        });
    }

    // 6. Check unsubscribe (informational only - will be auto-added)
    if (!hasUnsubscribeText(fullContent)) {
        // Lower score contribution - informational
        score += 10;
        warnings.push({
            type: 'missing_unsubscribe',
            message: 'Aucun lien de désinscription détecté. Sera ajouté automatiquement à l\'envoi.',
            severity: 'low',
            score: 10,
        });
    }

    // Calculate risk level based on thresholds
    let riskLevel: SpamRiskLevel;
    if (score < SPAM_THRESHOLDS.LOW) {
        riskLevel = SpamRiskLevel.LOW;
    } else if (score <= SPAM_THRESHOLDS.MEDIUM) {
        riskLevel = SpamRiskLevel.MEDIUM;
    } else {
        riskLevel = SpamRiskLevel.HIGH;
    }

    return {
        riskLevel,
        score,
        warnings,
    };
}

/**
 * Quick check if an email has any high-severity spam warnings
 */
export function hasHighSeverityWarnings(result: SpamAnalysisResult): boolean {
    return result.warnings.some(w => w.severity === 'high');
}
