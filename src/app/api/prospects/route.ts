import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { Prisma } from '@prisma/client';
import { success, error } from '@/lib/utils/api-response';
import { assertWorkspaceAccess, getWorkspaceId } from '@/lib/guardrails/workspace-check';
import { ProspectCreateSchema, ProspectStatusEnum, ProspectSourceEnum } from '@/types/prospect';
import type { ProspectStatus, ProspectSource } from '@/types/prospect';
import { mapProspect } from '@/lib/prisma/mappers';
import { queueEnrichment } from '@/lib/enrichment/enrichment-service';

/**
 * GET /api/prospects - List prospects with server-side pagination & filtering
 * Story 3.4: Prospect List & Status Display with Filters
 * 
 * Query params:
 * - page: number (default 1)
 * - pageSize: number (default 25, options: 25/50/100)
 * - search: string (searches firstName, lastName, email, company)
 * - status[]: ProspectStatus[] (multi-select filter)
 * - source[]: ProspectSource[] (multi-select filter)
 * - fromDate: ISO date string
 * - toDate: ISO date string
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const { searchParams } = new URL(req.url);

        // Pagination params with validation
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const pageSizeParam = parseInt(searchParams.get('pageSize') || '25');
        const pageSize = [25, 50, 100].includes(pageSizeParam) ? pageSizeParam : 25;

        // Search & filters
        const search = searchParams.get('search')?.trim() || '';
        const statusFilters = searchParams.getAll('status').filter(s =>
            ProspectStatusEnum.safeParse(s).success
        ) as ProspectStatus[];
        const sourceFilters = searchParams.getAll('source').filter(s =>
            ProspectSourceEnum.safeParse(s).success
        ) as ProspectSource[];
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');

        // Build Prisma where clause
        const where: Prisma.ProspectWhereInput = {
            workspaceId,
            deletedAt: null, // Exclude soft-deleted prospects (Story 3.6)
            ...(search && {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { company: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(statusFilters.length > 0 && { status: { in: statusFilters } }),
            ...(sourceFilters.length > 0 && { source: { in: sourceFilters } }),
            ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
            ...(toDate && { createdAt: { lte: new Date(toDate) } }),
        };

        // Execute paginated query + count in parallel
        const [prospects, total] = await Promise.all([
            prisma.prospect.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.prospect.count({ where }),
        ]);

        return NextResponse.json(success({
            prospects: prospects.map(mapProspect),
            total,
            page,
            pageSize,
        }));
    } catch (e) {
        console.error('GET /api/prospects error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
        }

        const workspaceId = await getWorkspaceId(user.id);
        await assertWorkspaceAccess(user.id, workspaceId);

        const body = await req.json();
        const parsed = ProspectCreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                error('VALIDATION_ERROR', 'Données invalides', parsed.error.flatten()),
                { status: 400 }
            );
        }

        const { email, firstName, lastName, company, title, phone, linkedinUrl, source, sourceDetail } = parsed.data;

        // Check for duplicate email within workspace (excluding soft-deleted)
        const existing = await prisma.prospect.findFirst({
            where: { workspaceId, email: email.toLowerCase().trim(), deletedAt: null }
        });

        if (existing) {
            return NextResponse.json(
                error('DUPLICATE_PROSPECT', 'Ce prospect existe déjà', { prospectId: existing.id }),
                { status: 409 }
            );
        }

        const prospect = await prisma.prospect.create({
            data: {
                workspaceId,
                email: email.toLowerCase().trim(),
                firstName: firstName || null,
                lastName: lastName || null,
                company: company || null,
                title: title || null,
                phone: phone || null,
                linkedinUrl: linkedinUrl || null,
                source,
                sourceDetail: sourceDetail || null,
                status: 'NEW',
            }
        });

        // Auto-queue enrichment for NEW prospects (Story 3.5 - AC1)
        try {
            await queueEnrichment(prospect.id, workspaceId);
            console.log(`[Prospects] Queued enrichment for prospect ${prospect.id}`);
        } catch (enrichError) {
            // Log but don't fail prospect creation if enrichment queue fails
            console.error(`[Prospects] Failed to queue enrichment for ${prospect.id}:`, enrichError);
        }

        return NextResponse.json(success(mapProspect(prospect)), { status: 201 });
    } catch (e) {
        console.error('POST /api/prospects error:', e);
        return NextResponse.json(error('INTERNAL_ERROR', 'Erreur serveur'), { status: 500 });
    }
}

