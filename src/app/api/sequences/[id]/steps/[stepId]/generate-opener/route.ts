/**
 * Opener Generation API Route
 * 
 * POST: Generate a new opener for a prospect/sequence/step
 * PUT: Regenerate an existing opener (uses quota)
 * 
 * Story 4.4: LLM Opener Personalization (MVP Safe)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { llmProvider as llm, LLMError, MAX_REGENERATIONS, GENERATION_TIMEOUT_MS, type OpenerResult } from '@/lib/llm';
import { z } from 'zod';


// ============================================================================
// Validation Schema
// ============================================================================

const GenerateOpenerSchema = z.object({
    prospectId: z.string().min(1, 'prospectId requis'),
});

// ============================================================================
// Route Params Type
// ============================================================================

interface RouteParams {
    params: Promise<{ id: string; stepId: string }>;
}

// ============================================================================
// POST - Generate new opener (AC1, AC2, AC4, AC5)
// ============================================================================

/**
 * POST /api/sequences/[id]/steps/[stepId]/generate-opener
 * 
 * Generates a personalized opener using LLM. Returns cached result if available.
 * Creates new cache entry on first generation.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id: sequenceId, stepId } = await params;

        // Auth
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        // Parse body
        const body = await req.json();
        const parsed = GenerateOpenerSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }
        const { prospectId } = parsed.data;

        // Verify step exists and belongs to workspace
        const step = await prisma.sequenceStep.findFirst({
            where: {
                id: stepId,
                sequenceId,
                sequence: { workspaceId },
            },
        });

        if (!step) {
            return NextResponse.json(error('NOT_FOUND', 'Étape introuvable'), { status: 404 });
        }

        // AC4: Check cache first
        const cached = await prisma.openerCache.findUnique({
            where: {
                workspaceId_prospectId_sequenceId_stepId: {
                    workspaceId,
                    prospectId,
                    sequenceId,
                    stepId,
                },
            },
        });

        if (cached) {
            // Return cached opener
            const result: OpenerResult = {
                text: cached.openerText,
                generatedAt: cached.createdAt.toISOString(),
                regenerationsRemaining: MAX_REGENERATIONS - cached.regenerationCount,
            };
            return NextResponse.json(success(result));
        }

        // Get prospect data
        const prospect = await prisma.prospect.findFirst({
            where: {
                id: prospectId,
                workspaceId,
                deletedAt: null,
            },
            select: {
                firstName: true,
                lastName: true,
                company: true,
                title: true,
            },
        });

        if (!prospect) {
            return NextResponse.json(error('NOT_FOUND', 'Prospect introuvable'), { status: 404 });
        }

        // AC1: Generate with LLM (includes 30s timeout - AC5)
        try {
            const opener = await llm.generateOpener({
                prospectFirstName: prospect.firstName,
                prospectLastName: prospect.lastName,
                prospectCompany: prospect.company,
                prospectTitle: prospect.title,
            });

            // Store in cache
            const newCache = await prisma.openerCache.create({
                data: {
                    workspaceId,
                    prospectId,
                    sequenceId,
                    stepId,
                    openerText: opener,
                    regenerationCount: 0,
                },
            });

            const result: OpenerResult = {
                text: opener,
                generatedAt: newCache.createdAt.toISOString(),
                regenerationsRemaining: MAX_REGENERATIONS,
            };

            return NextResponse.json(success(result), { status: 201 });

        } catch (err) {
            // AC5: Handle timeout and LLM errors
            if (err instanceof LLMError) {
                if (err.code === 'GENERATION_TIMEOUT') {
                    return NextResponse.json(
                        error('GENERATION_TIMEOUT', 'Impossible de générer. Écrivez votre propre opener.'),
                        { status: 504 }
                    );
                }
                if (err.code === 'RATE_LIMIT_EXCEEDED') {
                    return NextResponse.json(
                        error('RATE_LIMIT', err.message),
                        { status: 429 }
                    );
                }
                // Other LLM errors
                return NextResponse.json(
                    error('LLM_ERROR', err.message),
                    { status: 500 }
                );
            }
            throw err;
        }

    } catch (e) {
        console.error('[generate-opener] POST error:', e);
        return NextResponse.json(
            error('INTERNAL_ERROR', 'Erreur lors de la génération'),
            { status: 500 }
        );
    }
}

// ============================================================================
// PUT - Regenerate opener (AC3)
// ============================================================================

/**
 * PUT /api/sequences/[id]/steps/[stepId]/generate-opener
 * 
 * Regenerates an opener. Limited to 3 regenerations per prospect/sequence/step.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { id: sequenceId, stepId } = await params;

        // Auth
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        // Parse body
        const body = await req.json();
        const parsed = GenerateOpenerSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }
        const { prospectId } = parsed.data;

        // Verify step exists and belongs to workspace
        const step = await prisma.sequenceStep.findFirst({
            where: {
                id: stepId,
                sequenceId,
                sequence: { workspaceId },
            },
        });

        if (!step) {
            return NextResponse.json(error('NOT_FOUND', 'Étape introuvable'), { status: 404 });
        }

        // Get cached opener
        const cached = await prisma.openerCache.findUnique({
            where: {
                workspaceId_prospectId_sequenceId_stepId: {
                    workspaceId,
                    prospectId,
                    sequenceId,
                    stepId,
                },
            },
        });

        if (!cached) {
            return NextResponse.json(
                error('NOT_FOUND', 'Aucun opener à régénérer. Générez d\'abord un opener.'),
                { status: 404 }
            );
        }

        // AC3: Check regeneration quota
        if (cached.regenerationCount >= MAX_REGENERATIONS) {
            return NextResponse.json(
                error('QUOTA_EXCEEDED', 'Quota de régénérations atteint (3/3)'),
                { status: 429 }
            );
        }

        // Get prospect data
        const prospect = await prisma.prospect.findFirst({
            where: {
                id: prospectId,
                workspaceId,
                deletedAt: null,
            },
            select: {
                firstName: true,
                lastName: true,
                company: true,
                title: true,
            },
        });

        if (!prospect) {
            return NextResponse.json(error('NOT_FOUND', 'Prospect introuvable'), { status: 404 });
        }

        // Generate new opener
        try {
            const opener = await llm.generateOpener({
                prospectFirstName: prospect.firstName,
                prospectLastName: prospect.lastName,
                prospectCompany: prospect.company,
                prospectTitle: prospect.title,
            });

            // Update cache with new opener and increment regeneration count
            const updated = await prisma.openerCache.update({
                where: { id: cached.id },
                data: {
                    openerText: opener,
                    regenerationCount: { increment: 1 },
                },
            });

            const result: OpenerResult = {
                text: opener,
                generatedAt: updated.updatedAt.toISOString(),
                regenerationsRemaining: MAX_REGENERATIONS - updated.regenerationCount,
            };

            return NextResponse.json(success(result));

        } catch (err) {
            // Handle LLM errors
            if (err instanceof LLMError) {
                if (err.code === 'GENERATION_TIMEOUT') {
                    return NextResponse.json(
                        error('GENERATION_TIMEOUT', 'Impossible de générer. Écrivez votre propre opener.'),
                        { status: 504 }
                    );
                }
                if (err.code === 'RATE_LIMIT_EXCEEDED') {
                    return NextResponse.json(
                        error('RATE_LIMIT', err.message),
                        { status: 429 }
                    );
                }
                return NextResponse.json(
                    error('LLM_ERROR', err.message),
                    { status: 500 }
                );
            }
            throw err;
        }

    } catch (e) {
        console.error('[generate-opener] PUT error:', e);
        return NextResponse.json(
            error('INTERNAL_ERROR', 'Erreur lors de la régénération'),
            { status: 500 }
        );
    }
}
