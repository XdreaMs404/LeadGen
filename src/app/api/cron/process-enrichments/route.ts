/**
 * Cron Worker: Process Enrichment Jobs
 * Runs every 5 minutes via Vercel Cron
 * Processes pending enrichment jobs and polls for results
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { processEnrichmentJob, submitEnrichmentBatch } from '@/lib/enrichment/enrichment-service';
import { canMakeRequest } from '@/lib/dropcontact/rate-limiter';

const MAX_JOBS_PER_RUN = 50;

interface ProcessingResult {
    processed: number;
    succeeded: number;
    failed: number;
    skipped: number;
}

// Vercel Cron secret verification
function verifyCronSecret(request: NextRequest): boolean {
    if (process.env.NODE_ENV !== 'production') {
        return true; // Skip verification in development
    }

    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error('[Cron] CRON_SECRET environment variable not set');
        return false;
    }

    return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
    // Verify cron secret
    if (!verifyCronSecret(request)) {
        return NextResponse.json(
            { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
            { status: 401 }
        );
    }

    console.log('[Cron] Starting enrichment job processing');

    try {
        // Fetch pending jobs and failed jobs ready for retry
        const jobs = await prisma.enrichmentJob.findMany({
            where: {
                OR: [
                    { status: 'PENDING' },
                    { status: 'IN_PROGRESS' }, // Jobs that were submitted but not yet polled
                    {
                        status: 'FAILED',
                        nextRetryAt: { lte: new Date() },
                    },
                ],
            },
            take: MAX_JOBS_PER_RUN,
            orderBy: { createdAt: 'asc' },
            include: { prospect: true },
        });

        console.log(`[Cron] Found ${jobs.length} jobs to process`);

        const results: ProcessingResult = {
            processed: 0,
            succeeded: 0,
            failed: 0,
            skipped: 0,
        };

        // Group jobs by workspace for rate limiting awareness
        const jobsByWorkspace = new Map<string, typeof jobs>();
        for (const job of jobs) {
            const workspaceJobs = jobsByWorkspace.get(job.workspaceId) || [];
            workspaceJobs.push(job);
            jobsByWorkspace.set(job.workspaceId, workspaceJobs);
        }

        // Process jobs respecting rate limits
        // Process jobs respecting rate limits
        for (const [workspaceId, workspaceJobs] of jobsByWorkspace) {
            // Check rate limit before processing
            if (!canMakeRequest(workspaceId)) {
                console.log(`[Cron] Rate limited for workspace ${workspaceId}, skipping remaining jobs`);
                results.skipped += workspaceJobs.length;
                continue;
            }

            // Separate jobs into PENDING (batchable) and others (poll/retry)
            const pendingJobs = workspaceJobs.filter(j => j.status === 'PENDING');
            const otherJobs = workspaceJobs.filter(j => j.status !== 'PENDING');

            // 1. Submit pending jobs in batch
            if (pendingJobs.length > 0) {
                try {
                    const submittedCount = await submitEnrichmentBatch(pendingJobs);
                    if (submittedCount > 0) {
                        results.processed += pendingJobs.length;
                        results.succeeded += pendingJobs.length; // Optimistic count
                    } else {
                        results.processed += pendingJobs.length;
                        results.skipped += pendingJobs.length; // Rate limited or failed
                    }
                } catch (e) {
                    console.error(`[Cron] Batch submission failed for workspace ${workspaceId}`, e);
                    results.failed += pendingJobs.length;
                }
            }

            // 2. Process other jobs (polling, retrying) individually
            for (const job of otherJobs) {
                try {
                    const result = await processEnrichmentJob(job);
                    results.processed++;

                    if (result.success) {
                        results.succeeded++;
                    } else if (result.error === 'Rate limited') {
                        results.skipped++;
                    } else {
                        results.failed++;
                    }
                } catch (error) {
                    console.error(`[Cron] Error processing job ${job.id}:`, error);
                    results.processed++;
                    results.failed++;
                }
            }
        }

        console.log(`[Cron] Completed: ${results.processed} processed, ${results.succeeded} succeeded, ${results.failed} failed, ${results.skipped} skipped`);

        return NextResponse.json({
            success: true,
            data: results,
        });
    } catch (error) {
        console.error('[Cron] Fatal error:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
            },
            { status: 500 }
        );
    }
}

// Prevent caching
export const dynamic = 'force-dynamic';
