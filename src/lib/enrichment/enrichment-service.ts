/**
 * Enrichment Service
 * Core logic for prospect enrichment via Dropcontact
 */

import { prisma } from '@/lib/prisma/client';
import { submitEnrichmentRequest, fetchEnrichmentResult, isEmailVerified, DropcontactApiError } from '@/lib/dropcontact/client';
import { acquireDropcontactSlot, releaseDropcontactSlot } from '@/lib/dropcontact/rate-limiter';
import type { DropcontactEnrichedContact, ProspectEnrichmentData } from '@/lib/dropcontact/types';
import { Prisma } from '@prisma/client';
import type { EnrichmentJob, Prospect, ProspectStatus } from '@prisma/client';

// Retry delays in seconds: 1min, 5min, 15min
const RETRY_DELAYS = [60, 300, 900];

interface EnrichmentResult {
    success: boolean;
    prospectId: string;
    status: ProspectStatus;
    error?: string;
}

/**
 * Queue an enrichment job for a prospect
 * @param prospectId - The prospect ID to enrich
 * @param workspaceId - The workspace ID
 * @returns The created enrichment job
 */
export async function queueEnrichment(
    prospectId: string,
    workspaceId: string
): Promise<EnrichmentJob> {
    // Check if there's already a pending/in-progress job for this prospect
    const existingJob = await prisma.enrichmentJob.findFirst({
        where: {
            prospectId,
            status: {
                in: ['PENDING', 'IN_PROGRESS'],
            },
        },
    });

    if (existingJob) {
        console.log(`[Enrichment] Job already exists for prospect ${prospectId}: ${existingJob.id}`);
        return existingJob;
    }

    // Create new enrichment job
    const job = await prisma.enrichmentJob.create({
        data: {
            prospectId,
            workspaceId,
            status: 'PENDING',
            attempts: 0,
        },
    });

    console.log(`[Enrichment] Created job ${job.id} for prospect ${prospectId}`);
    return job;
}

/**
 * Queue enrichment jobs for multiple prospects (Batch)
 * @param prospectIds - Array of prospect IDs
 * @param workspaceId - The workspace ID
 * @returns Count of jobs created
 */
export async function queueBatchEnrichment(
    prospectIds: string[],
    workspaceId: string
): Promise<number> {
    if (prospectIds.length === 0) return 0;

    // Filter out prospects that already have pending jobs
    const existingJobs = await prisma.enrichmentJob.findMany({
        where: {
            prospectId: { in: prospectIds },
            status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        select: { prospectId: true },
    });

    const existingProspectIds = new Set(existingJobs.map(j => j.prospectId));
    const newProspectIds = prospectIds.filter(id => !existingProspectIds.has(id));

    if (newProspectIds.length === 0) return 0;

    // Batch create jobs
    await prisma.enrichmentJob.createMany({
        data: newProspectIds.map(id => ({
            prospectId: id,
            workspaceId,
            status: 'PENDING',
            attempts: 0,
        })),
    });

    console.log(`[Enrichment] Queued batch of ${newProspectIds.length} jobs`);
    return newProspectIds.length;
}

/**
 * Calculate the next retry time based on attempt count
 * @param attempts - Number of attempts so far
 * @returns Date for next retry, or null if max retries exceeded
 */
export function calculateNextRetry(attempts: number): Date | null {
    if (attempts >= RETRY_DELAYS.length) {
        return null; // No more retries
    }
    return new Date(Date.now() + RETRY_DELAYS[attempts] * 1000);
}

/**
 * Handle enrichment job failure with exponential backoff
 */
async function handleEnrichmentFailure(
    job: EnrichmentJob,
    errorMessage: string
): Promise<void> {
    const nextRetry = calculateNextRetry(job.attempts);

    if (!nextRetry) {
        // Max retries exceeded → update prospect to NEEDS_REVIEW
        console.log(`[Enrichment] Max retries exceeded for job ${job.id}, marking prospect as NEEDS_REVIEW`);

        await prisma.$transaction([
            prisma.enrichmentJob.update({
                where: { id: job.id },
                data: {
                    status: 'FAILED',
                    lastError: errorMessage,
                    completedAt: new Date(),
                },
            }),
            prisma.prospect.update({
                where: { id: job.prospectId },
                data: { status: 'NEEDS_REVIEW' },
            }),
        ]);
    } else {
        // Schedule retry
        console.log(`[Enrichment] Scheduling retry for job ${job.id} at ${nextRetry.toISOString()}`);

        await prisma.enrichmentJob.update({
            where: { id: job.id },
            data: {
                status: 'FAILED',
                attempts: job.attempts + 1,
                lastError: errorMessage,
                nextRetryAt: nextRetry,
            },
        });
    }
}

/**
 * Submit a job to Dropcontact for enrichment
 */
export async function submitJobToDropcontact(
    job: EnrichmentJob & { prospect: Prospect }
): Promise<string | null> {
    const { prospect } = job;

    // Update prospect status to ENRICHING
    await prisma.prospect.update({
        where: { id: prospect.id },
        data: { status: 'ENRICHING' },
    });

    // Mark job as in-progress
    await prisma.enrichmentJob.update({
        where: { id: job.id },
        data: { status: 'IN_PROGRESS' },
    });

    try {
        const requestId = await submitEnrichmentRequest([
            {
                email: prospect.email,
                first_name: prospect.firstName ?? undefined,
                last_name: prospect.lastName ?? undefined,
                company: prospect.company ?? undefined,
                linkedin: prospect.linkedinUrl ?? undefined,
                phone: prospect.phone ?? undefined,
            },
        ]);

        // Store request_id for polling
        await prisma.enrichmentJob.update({
            where: { id: job.id },
            data: { requestId },
        });

        console.log(`[Enrichment] Submitted job ${job.id} to Dropcontact, request_id: ${requestId}`);
        return requestId;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Enrichment] Failed to submit job ${job.id}:`, errorMessage);

        await handleEnrichmentFailure(job, errorMessage);
        return null;
    }
}

/**
 * Poll Dropcontact for job results and update prospect
 */
export async function pollJobResult(
    job: EnrichmentJob & { prospect: Prospect }
): Promise<EnrichmentResult> {
    if (!job.requestId) {
        throw new Error(`Job ${job.id} has no requestId`);
    }

    try {
        const result = await fetchEnrichmentResult(job.requestId);

        if (result.status === 'pending') {
            console.log(`[Enrichment] Job ${job.id} still pending`);
            return {
                success: false,
                prospectId: job.prospectId,
                status: 'ENRICHING',
            };
        }

        if (result.status === 'error' || !result.success) {
            throw new DropcontactApiError(
                result.error || 'Enrichment failed',
                'ENRICHMENT_ERROR'
            );
        }

        // Process enriched data
        const enrichedContact = result.data?.[0];
        if (!enrichedContact) {
            throw new DropcontactApiError('No enriched data returned', 'EMPTY_RESULT');
        }

        // Determine new status based on email verification
        // Pass job.prospect.email to allow trusted domain check
        const emailVerified = isEmailVerified(enrichedContact.email_score, job.prospect.email);
        const newStatus: ProspectStatus = emailVerified ? 'VERIFIED' : 'NOT_VERIFIED';

        // Prepare enrichment data
        const enrichmentData: ProspectEnrichmentData = {
            dropcontact: enrichedContact,
        };

        // Update prospect with enriched data
        await prisma.$transaction([
            prisma.prospect.update({
                where: { id: job.prospectId },
                data: {
                    status: newStatus,
                    enrichmentSource: 'dropcontact',
                    enrichedAt: new Date(),
                    enrichmentData: enrichmentData as unknown as Prisma.InputJsonValue,
                    // Update fields if we have better data
                    ...(enrichedContact.company && !job.prospect.company && { company: enrichedContact.company }),
                    ...(enrichedContact.job_title && !job.prospect.title && { title: enrichedContact.job_title }),
                    ...(enrichedContact.linkedin && !job.prospect.linkedinUrl && { linkedinUrl: enrichedContact.linkedin }),
                    ...(enrichedContact.phone && !job.prospect.phone && { phone: enrichedContact.phone }),
                },
            }),
            prisma.enrichmentJob.update({
                where: { id: job.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            }),
        ]);

        console.log(`[Enrichment] Completed job ${job.id}, prospect status: ${newStatus}`);

        return {
            success: true,
            prospectId: job.prospectId,
            status: newStatus,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Enrichment] Failed to poll job ${job.id}:`, errorMessage);

        await handleEnrichmentFailure(job, errorMessage);

        return {
            success: false,
            prospectId: job.prospectId,
            status: 'NEEDS_REVIEW',
            error: errorMessage,
        };
    }
}

/**
 * Process a single enrichment job (submit or poll based on state)
 */
export async function processEnrichmentJob(
    job: EnrichmentJob & { prospect: Prospect }
): Promise<EnrichmentResult> {
    const { workspaceId } = job;

    // Try to acquire rate limit slot
    if (!acquireDropcontactSlot(workspaceId)) {
        console.log(`[Enrichment] Rate limited for workspace ${workspaceId}, skipping job ${job.id}`);
        return {
            success: false,
            prospectId: job.prospectId,
            status: job.prospect.status,
            error: 'Rate limited',
        };
    }

    try {
        // If job has request_id, poll for results
        if (job.requestId) {
            return await pollJobResult(job);
        }

        // Otherwise, submit to Dropcontact
        const requestId = await submitJobToDropcontact(job);

        return {
            success: requestId !== null,
            prospectId: job.prospectId,
            status: requestId ? 'ENRICHING' : 'NEEDS_REVIEW',
        };
    } finally {
        releaseDropcontactSlot(workspaceId);
    }
}

/**
 * Submit a batch of jobs vs contacts to Dropcontact
 */
export async function submitEnrichmentBatch(
    jobs: (EnrichmentJob & { prospect: Prospect })[]
): Promise<number> {
    if (jobs.length === 0) return 0;

    const workspaceId = jobs[0].workspaceId;

    // Acquire slot
    if (!acquireDropcontactSlot(workspaceId)) {
        console.log(`[Enrichment] Rate limited for workspace ${workspaceId}, skipping batch`);
        return 0;
    }

    try {
        // Optimistic update: Mark all as IN_PROGRESS
        await prisma.enrichmentJob.updateMany({
            where: { id: { in: jobs.map(j => j.id) } },
            data: { status: 'IN_PROGRESS' },
        });

        // Also update prospects
        await prisma.prospect.updateMany({
            where: { id: { in: jobs.map(j => j.prospectId) } },
            data: { status: 'ENRICHING' },
        });

        const contacts = jobs.map(job => ({
            email: job.prospect.email,
            first_name: job.prospect.firstName ?? undefined,
            last_name: job.prospect.lastName ?? undefined,
            company: job.prospect.company ?? undefined,
            linkedin: job.prospect.linkedinUrl ?? undefined,
            phone: job.prospect.phone ?? undefined,
        }));

        const requestId = await submitEnrichmentRequest(contacts);

        // Update jobs with requestId
        await prisma.enrichmentJob.updateMany({
            where: { id: { in: jobs.map(j => j.id) } },
            data: { requestId },
        });

        console.log(`[Enrichment] Batch submitted: ${jobs.length} jobs, requestId: ${requestId}`);
        return jobs.length;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Enrichment] Failed to submit batch:`, errorMessage);

        // Fail all jobs in batch
        // Note: Ideally we retry, but for now mark failed to trigger retry logic later
        await prisma.enrichmentJob.updateMany({
            where: { id: { in: jobs.map(j => j.id) } },
            data: {
                status: 'FAILED',
                lastError: errorMessage,
                attempts: { increment: 1 },
                nextRetryAt: calculateNextRetry(0) // Schedule retry in 1 minute
            },
        });

        return 0;
    } finally {
        releaseDropcontactSlot(workspaceId);
    }
}

/**
 * Get retry delays for external use/testing
 */
export { RETRY_DELAYS };
