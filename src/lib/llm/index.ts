/**
 * LLM Module Entry Point
 * 
 * Exports the active LLM provider for easy switching.
 * Currently uses Gemini 2.0 Flash as per MVP requirements.
 */

import { geminiProvider } from './gemini';
import type { LLMProvider } from './types';

// Re-export types for convenience
export * from './types';

// Export active provider (renamed for clarity)
export const llmProvider: LLMProvider = geminiProvider;
