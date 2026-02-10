/**
 * LLM Provider Types & Interfaces
 * Story 4.4: AI Email Assistant
 */

// ============================================================================
// Email Generation Types
// ============================================================================

/**
 * Request to generate an email from a prompt
 */
export interface EmailGenerationRequest {
    mode: 'generate';
    prompt: string;
}

/**
 * Request to improve existing email content
 */
export interface EmailImproveRequest {
    mode: 'improve';
    subject: string;
    body: string;
}

/**
 * Result from email generation or improvement
 */
export interface EmailResult {
    subject: string;
    body: string;
}

// ============================================================================
// Opener (Personalization) Types
// ============================================================================

/**
 * Context for generating personalized opener text
 */
export interface OpenerContext {
    prospectFirstName: string | null;
    prospectLastName: string | null;
    prospectCompany: string | null;
    prospectTitle: string | null;
}

/**
 * Result from opener generation
 */
export interface OpenerResult {
    text: string;
    generatedAt: string;
    regenerationsRemaining: number;
}

// ============================================================================
// Classification Types (Story 6.4)
// ============================================================================

/**
 * Context for classifying a reply
 */
export interface ClassificationContext {
    prospectName?: string;
    campaignName?: string;
    sequenceName?: string;
}

/**
 * Result from reply classification
 */
export interface ClassificationResult {
    classification: string;
    confidence: number;
    reasoning: string;
}

// ============================================================================
// LLM Provider Interface
// ============================================================================

/**
 * Interface for LLM providers
 * Allows swapping between different AI services (Gemini, OpenAI, etc.)
 */
export interface LLMProvider {
    /** Generate full email from prompt */
    generateEmail(prompt: string): Promise<EmailResult>;

    /** Improve existing email content */
    improveEmail(subject: string, body: string): Promise<EmailResult>;

    /** Generate personalized opener */
    generateOpener(context: OpenerContext): Promise<string>;

    /** Classify a cold email reply (Story 6.4) */
    classifyReply(body: string, context?: ClassificationContext): Promise<ClassificationResult>;
}

// ============================================================================
// Error Handling
// ============================================================================

export type LLMErrorCode =
    | 'GENERATION_TIMEOUT'
    | 'RATE_LIMIT_EXCEEDED'
    | 'QUOTA_EXCEEDED'
    | 'PROVIDER_ERROR'
    | 'INVALID_REQUEST'
    | 'INVALID_CONTEXT';

/**
 * Custom error class for LLM-related errors
 */
export class LLMError extends Error {
    constructor(
        public code: LLMErrorCode,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'LLMError';
    }
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of regenerations allowed per prospect/step */
export const MAX_REGENERATIONS = 3;

/** Timeout for LLM generation in milliseconds (30 seconds) */
export const GENERATION_TIMEOUT_MS = 30_000;

/** Timeout for classification in milliseconds (5 seconds) — Story 6.4 NFR3 */
export const CLASSIFICATION_TIMEOUT_MS = 5_000;

