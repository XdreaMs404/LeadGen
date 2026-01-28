/**
 * Prospect Import API Route
 * Story 3.2: CSV Import with Source Tracking & Validation
 * POST /api/prospects/import
 */
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { getWorkspaceId, assertWorkspaceAccess } from '@/lib/guardrails/workspace-check';
import { parseCsvContent } from '@/lib/import/csv-parser';
import { validateCsvRows } from '@/lib/import/csv-validator';
import { queueBatchEnrichment } from '@/lib/enrichment/enrichment-service';
import { ProspectSourceEnum, type ImportResult, type ProspectSource } from '@/types/prospect';

const BATCH_SIZE = 100;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
    try {
        // Authenticate user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        // Get workspace and verify access
        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        // Parse FormData
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const source = formData.get('source') as string | null;
        const sourceDetail = formData.get('sourceDetail') as string | null;
        const columnMappingRaw = formData.get('columnMapping') as string | null;

        // Validate required fields
        if (!file) {
            return NextResponse.json(error('VALIDATION_ERROR', 'Fichier CSV manquant'), { status: 400 });
        }
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(error('VALIDATION_ERROR', 'Le fichier dépasse la taille maximale de 5MB'), { status: 400 });
        }
        if (!source) {
            return NextResponse.json(error('VALIDATION_ERROR', 'Source manquante'), { status: 400 });
        }

        // Validate source enum
        const sourceResult = ProspectSourceEnum.safeParse(source);
        if (!sourceResult.success) {
            return NextResponse.json(error('VALIDATION_ERROR', 'Source invalide'), { status: 400 });
        }

        // Parse and validate column mapping
        const ColumnMappingSchema = z.record(z.string(), z.string());
        let columnMapping: Record<string, string> = {};

        if (columnMappingRaw) {
            try {
                const json = JSON.parse(columnMappingRaw);
                const result = ColumnMappingSchema.safeParse(json);
                if (!result.success) {
                    return NextResponse.json(error('VALIDATION_ERROR', 'Format de mapping invalide'), { status: 400 });
                }
                columnMapping = result.data;
            } catch {
                return NextResponse.json(error('VALIDATION_ERROR', 'JSON mapping invalide'), { status: 400 });
            }
        }

        // Read and parse CSV content
        const content = await file.text();
        const parsed = parseCsvContent(content);

        if (parsed.errors.length > 0 && parsed.rows.length === 0) {
            return NextResponse.json(error('PARSE_ERROR', 'Erreur de parsing du fichier CSV'), { status: 400 });
        }

        // Validate rows against schema and duplicates
        const validation = await validateCsvRows(parsed.rows, workspaceId, columnMapping);

        // Batch insert valid rows
        let imported = 0;
        const validProspectSource = sourceResult.data as ProspectSource;

        for (let i = 0; i < validation.validRows.length; i += BATCH_SIZE) {
            const batch = validation.validRows.slice(i, i + BATCH_SIZE);
            const result = await prisma.prospect.createMany({
                data: batch.map(row => ({
                    workspaceId,
                    email: row.email.toLowerCase().trim(),
                    firstName: row.firstName || null,
                    lastName: row.lastName || null,
                    company: row.company || null,
                    title: row.title || null,
                    phone: row.phone || null,
                    linkedinUrl: row.linkedinUrl || null,
                    source: validProspectSource,
                    sourceDetail: sourceDetail?.trim() || null,
                    status: 'NEW' as const,
                })),
                skipDuplicates: true,
            });
            imported += result.count;

            // Queue batch enrichment for these new prospects
            try {
                const emails = batch.map(row => row.email.toLowerCase().trim());
                const newProspects = await prisma.prospect.findMany({
                    where: {
                        workspaceId,
                        email: { in: emails },
                        status: 'NEW'
                    },
                    select: { id: true }
                });

                if (newProspects.length > 0) {
                    const idsToEnrich = newProspects.map(p => p.id);
                    await queueBatchEnrichment(idsToEnrich, workspaceId);
                }
            } catch (enrichError) {
                console.error('[Import] Failed to queue batch enrichment:', enrichError);
                // Don't fail the import, just log
            }
        }

        // TODO: Log to audit trail (Story 8.6)

        const importResult: ImportResult = {
            imported,
            duplicates: validation.duplicateCount,
            errors: validation.errors.length,
        };

        return NextResponse.json(success(importResult), { status: 201 });
    } catch (e) {
        console.error('POST /api/prospects/import error:', e);

        if (e instanceof Error && e.message === 'Unauthorized workspace access') {
            return NextResponse.json(error('FORBIDDEN', 'Accès non autorisé'), { status: 403 });
        }
        if (e instanceof Error && e.message === 'No workspace found for user') {
            return NextResponse.json(error('NOT_FOUND', 'Workspace non trouvé'), { status: 404 });
        }

        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}
