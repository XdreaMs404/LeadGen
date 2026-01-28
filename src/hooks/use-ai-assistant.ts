'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

interface EmailResult {
    subject: string;
    body: string;
}

interface GenerateRequest {
    mode: 'generate';
    prompt: string;
}

interface ImproveRequest {
    mode: 'improve';
    subject: string;
    body: string;
}

type AIRequest = GenerateRequest | ImproveRequest;

/**
 * AI Assistant Hook
 * Story 4.4 - Handles email generation and improvement via LLM
 */
export function useAIAssistant() {
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async (request: AIRequest): Promise<EmailResult> => {
            const res = await fetch('/api/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error?.message || 'Erreur lors de la génération');
            }

            return json.data;
        },
        onError: (err: Error) => {
            setError(err.message);
        },
        onSuccess: () => {
            setError(null);
        },
    });

    const generateEmail = async (prompt: string): Promise<EmailResult> => {
        setError(null);
        return mutation.mutateAsync({ mode: 'generate', prompt });
    };

    const improveEmail = async (subject: string, body: string): Promise<EmailResult> => {
        setError(null);
        return mutation.mutateAsync({ mode: 'improve', subject, body });
    };

    const reset = () => {
        setError(null);
        mutation.reset();
    };

    return {
        generateEmail,
        improveEmail,
        isLoading: mutation.isPending,
        error,
        reset,
    };
}
