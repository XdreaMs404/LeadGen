/**
 * Reply Classification Service (Story 6.4)
 *
 * Rules-first pipeline:
 * 1) Fast deterministic rules (OOO / UNSUBSCRIBE / BOUNCE)
 * 2) LLM fallback for semantic classes
 * 3) Low-confidence and failure handling
 */

import { llmProvider, type ClassificationContext as LLMClassificationContext } from '@/lib/llm';
import { prisma } from '@/lib/prisma/client';
import type {
    ClassificationMethod,
    InboxMessage,
    ReplyClassification,
} from '@prisma/client';
import { classifyByRules } from './fallback-rules';

const LOW_CONFIDENCE_THRESHOLD = 70;
const MAX_BODY_CHARS = 2000;

export interface MessageClassificationResult {
    classification: ReplyClassification | null;
    confidenceScore: number | null;
    classificationMethod: ClassificationMethod | null;
    needsReview: boolean;
    reasoning?: string;
    error?: string;
}

function clampConfidence(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeClassification(value: string): ReplyClassification | null {
    const normalized = value.trim().toUpperCase();
    const directMap: Record<string, ReplyClassification> = {
        INTERESTED: 'INTERESTED',
        NOT_NOW: 'NOT_NOW',
        NOT_INTERESTED: 'NOT_INTERESTED',
        NEGATIVE: 'NEGATIVE',
        OTHER: 'OTHER',
        OUT_OF_OFFICE: 'OUT_OF_OFFICE',
        UNSUBSCRIBE: 'UNSUBSCRIBE',
        BOUNCE: 'BOUNCE',
        NEEDS_REVIEW: 'NEEDS_REVIEW',
    };

    return directMap[normalized] ?? null;
}

/**
 * Classify a single persisted inbox message.
 *
 * IMPORTANT: this function never throws for provider failures.
 * It returns a recoverable state (classification=null, needsReview=true)
 * so sync can continue and retry on next cycle.
 */
export async function classifyMessage(
    message: Pick<InboxMessage, 'id' | 'direction' | 'subject' | 'bodyRaw' | 'bodyCleaned'>,
    context?: LLMClassificationContext
): Promise<MessageClassificationResult> {
    if (message.direction !== 'INBOUND') {
        return {
            classification: null,
            confidenceScore: null,
            classificationMethod: null,
            needsReview: false,
            reasoning: 'Messages sortants non classifiés.',
        };
    }

    const subject = message.subject ?? '';
    const body = (message.bodyCleaned || message.bodyRaw || '').trim().slice(0, MAX_BODY_CHARS);

    const byRule = classifyByRules(body, subject);
    if (byRule) {
        return {
            classification: byRule.classification,
            confidenceScore: byRule.confidence,
            classificationMethod: byRule.method,
            needsReview: false,
            reasoning: 'Classification par règle.',
        };
    }

    if (!body && !subject.trim()) {
        return {
            classification: 'OTHER',
            confidenceScore: 15,
            classificationMethod: 'LLM',
            needsReview: true,
            reasoning: 'Message vide.',
        };
    }

    try {
        const llmResult = await llmProvider.classifyReply(`${subject}\n${body}`.trim(), context);
        const classification = normalizeClassification(llmResult.classification);
        const confidenceScore = clampConfidence(llmResult.confidence);

        if (!classification) {
            throw new Error(`Classification LLM invalide: ${llmResult.classification}`);
        }

        const needsReview = confidenceScore < LOW_CONFIDENCE_THRESHOLD;

        return {
            classification,
            confidenceScore,
            classificationMethod: 'LLM',
            needsReview,
            reasoning: llmResult.reasoning,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[classification] LLM classification failed for message ${message.id}:`, errorMessage);

        return {
            classification: null,
            confidenceScore: null,
            classificationMethod: null,
            needsReview: true,
            reasoning: 'Classification indisponible, nouvelle tentative au prochain sync.',
            error: errorMessage,
        };
    }
}

/**
 * Persist classification fields on inbox message.
 */
export async function applyClassification(
    messageId: string,
    result: MessageClassificationResult
): Promise<void> {
    await prisma.inboxMessage.update({
        where: { id: messageId },
        data: {
            classification: result.classification,
            confidenceScore: result.confidenceScore,
            classificationMethod: result.classificationMethod,
            needsReview: result.needsReview,
        },
    });
}
