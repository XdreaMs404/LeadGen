/**
 * AI Assistant API Route
 * Story 4.4: AI Email Assistant
 * 
 * POST /api/ai-assistant
 * - mode: 'generate' - Generate email from prompt
 * - mode: 'improve' - Improve existing email
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { llmProvider } from '@/lib/llm';
import { LLMError } from '@/lib/llm/types';

// ============================================================================
// Request Validation
// ============================================================================

const GenerateRequestSchema = z.object({
    mode: z.literal('generate'),
    prompt: z.string().min(10, 'Le prompt doit faire au moins 10 caractères'),
});

const ImproveRequestSchema = z.object({
    mode: z.literal('improve'),
    subject: z.string(),
    body: z.string().min(10, 'Le contenu doit faire au moins 10 caractères'),
});

const RequestSchema = z.discriminatedUnion('mode', [
    GenerateRequestSchema,
    ImproveRequestSchema,
]);

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } },
                { status: 401 }
            );
        }

        // Parse and validate request
        const body = await request.json();
        const parseResult = RequestSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: parseResult.error.issues[0]?.message || 'Requête invalide'
                    }
                },
                { status: 400 }
            );
        }

        const data = parseResult.data;

        // Call LLM based on mode
        let result;
        if (data.mode === 'generate') {
            result = await llmProvider.generateEmail(data.prompt);
        } else {
            result = await llmProvider.improveEmail(data.subject, data.body);
        }

        return NextResponse.json({
            success: true,
            data: result,
        });

    } catch (error) {
        console.error('[AI Assistant] Error:', error);

        if (error instanceof LLMError) {
            const statusMap: Record<string, number> = {
                'GENERATION_TIMEOUT': 504,
                'RATE_LIMIT_EXCEEDED': 429,
                'QUOTA_EXCEEDED': 429,
                'PROVIDER_ERROR': 502,
                'INVALID_REQUEST': 400,
            };

            return NextResponse.json(
                {
                    success: false,
                    error: { code: error.code, message: error.message }
                },
                { status: statusMap[error.code] || 500 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Une erreur est survenue lors de la génération'
                }
            },
            { status: 500 }
        );
    }
}
