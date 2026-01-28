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
}

// ============================================================================
// Error Handling
// ============================================================================

export type LLMErrorCode =
    | 'GENERATION_TIMEOUT'
    | 'RATE_LIMIT_EXCEEDED'
    | 'QUOTA_EXCEEDED'
    | 'PROVIDER_ERROR'
    | 'INVALID_REQUEST';

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

/** Timeout for LLM generation in milliseconds (30 seconds) */
export const GENERATION_TIMEOUT_MS = 30_000;
