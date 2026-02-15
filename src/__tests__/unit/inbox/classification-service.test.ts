import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    applyClassification,
    classifyMessage,
    type MessageClassificationResult,
} from '@/lib/inbox/classification/classification-service';
import { llmProvider } from '@/lib/llm';
import { prisma } from '@/lib/prisma/client';

vi.mock('@/lib/llm', () => ({
    llmProvider: {
        classifyReply: vi.fn(),
    },
}));

vi.mock('@/lib/prisma/client', () => ({
    prisma: {
        inboxMessage: {
            update: vi.fn(),
        },
    },
}));

const baseMessage = {
    id: 'msg-1',
    direction: 'INBOUND' as const,
    subject: 'Question',
    bodyRaw: 'Merci pour votre email.',
    bodyCleaned: 'Merci pour votre email.',
};

describe('classification-service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('applies rules before LLM', async () => {
        const result = await classifyMessage({
            ...baseMessage,
            bodyCleaned: 'I am out of office this week',
        });

        expect(result.classification).toBe('OUT_OF_OFFICE');
        expect(result.classificationMethod).toBe('RULE');
        expect(result.confidenceScore).toBe(100);
        expect(vi.mocked(llmProvider.classifyReply)).not.toHaveBeenCalled();
    });

    it('uses LLM when no rule matches', async () => {
        vi.mocked(llmProvider.classifyReply).mockResolvedValue({
            classification: 'INTERESTED',
            confidence: 92,
            reasoning: 'The prospect asked for a meeting.',
        });

        const result = await classifyMessage(baseMessage);

        expect(llmProvider.classifyReply).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            classification: 'INTERESTED',
            confidenceScore: 92,
            classificationMethod: 'LLM',
            needsReview: false,
            reasoning: 'The prospect asked for a meeting.',
        });
    });

    it('flags low confidence as needsReview', async () => {
        vi.mocked(llmProvider.classifyReply).mockResolvedValue({
            classification: 'OTHER',
            confidence: 61,
            reasoning: 'Ambiguous intent.',
        });

        const result = await classifyMessage(baseMessage);

        expect(result.classification).toBe('OTHER');
        expect(result.classificationMethod).toBe('LLM');
        expect(result.needsReview).toBe(true);
    });

    it('handles LLM failures gracefully', async () => {
        vi.mocked(llmProvider.classifyReply).mockRejectedValue(new Error('provider down'));

        const result = await classifyMessage(baseMessage);

        expect(result.classification).toBeNull();
        expect(result.classificationMethod).toBeNull();
        expect(result.needsReview).toBe(true);
        expect(result.error).toContain('provider down');
    });

    it('handles timeout errors gracefully', async () => {
        vi.mocked(llmProvider.classifyReply).mockRejectedValue(new Error('GENERATION_TIMEOUT'));

        const result = await classifyMessage(baseMessage);

        expect(result.classification).toBeNull();
        expect(result.needsReview).toBe(true);
    });

    it('persists classification fields with applyClassification', async () => {
        const result: MessageClassificationResult = {
            classification: 'NEGATIVE',
            confidenceScore: 77,
            classificationMethod: 'LLM',
            needsReview: false,
            reasoning: 'Clear refusal.',
        };

        await applyClassification('msg-1', result);

        expect(prisma.inboxMessage.update).toHaveBeenCalledWith({
            where: { id: 'msg-1' },
            data: {
                classification: 'NEGATIVE',
                confidenceScore: 77,
                classificationMethod: 'LLM',
                needsReview: false,
            },
        });
    });
});
