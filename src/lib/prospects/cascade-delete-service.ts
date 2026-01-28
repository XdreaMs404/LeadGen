/**
 * Cascade Delete Service
 * Story 3.6: Handles cleanup of related data when a prospect is deleted
 */
import { prisma } from '@/lib/prisma/client';
import { Prisma } from '@prisma/client';

export interface CascadeSummary {
    enrichmentJobsCancelled: number;
    emailsCancelled: number;
    enrollmentsCancelled: number;
    threadsArchived: number;
}

/**
 * Cascade delete prospect-related data
 * - Cancels pending enrichment jobs
 * - In future: cancels scheduled emails, campaign enrollments, archives inbox threads
 */
export async function cascadeDeleteProspect(
    prospectId: string,
    userId: string,
    tx?: Prisma.TransactionClient
): Promise<CascadeSummary> {
    const client = tx ?? prisma;

    // 1. Cancel enrichment jobs (PENDING or IN_PROGRESS → CANCELLED)
    const enrichmentResult = await client.enrichmentJob.updateMany({
        where: {
            prospectId,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        data: { status: 'CANCELLED' },
    });

    // 2. Cancel scheduled emails (if table exists - future Epic 5)
    // const emailsResult = await client.scheduledEmail.updateMany({
    //   where: { prospectId, status: { in: ['PENDING', 'SCHEDULED'] } },
    //   data: { status: 'CANCELLED' },
    // });

    // 3. Cancel campaign enrollments (if table exists - future Epic 5)
    // const enrollmentsResult = await client.campaignEnrollment.updateMany({
    //   where: { prospectId, status: { in: ['ACTIVE', 'PENDING'] } },
    //   data: { status: 'REMOVED' },
    // });

    // 4. Archive inbox threads (if table exists - future Epic 6)
    // const threadsResult = await client.inboxThread.updateMany({
    //   where: { prospectId, archivedAt: null },
    //   data: { archivedAt: new Date() },
    // });

    return {
        enrichmentJobsCancelled: enrichmentResult.count,
        emailsCancelled: 0, // Epic 5 - not yet implemented
        enrollmentsCancelled: 0, // Epic 5 - not yet implemented
        threadsArchived: 0, // Epic 6 - not yet implemented
    };
}

/**
 * Bulk cascade delete for multiple prospects
 * Processes deletions within a transaction for atomicity
 */
export async function cascadeDeleteProspects(
    prospectIds: string[],
    userId: string,
    tx?: Prisma.TransactionClient
): Promise<CascadeSummary> {
    const client = tx ?? prisma;

    // Bulk cancel enrichment jobs
    const enrichmentResult = await client.enrichmentJob.updateMany({
        where: {
            prospectId: { in: prospectIds },
            status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        data: { status: 'CANCELLED' },
    });

    return {
        enrichmentJobsCancelled: enrichmentResult.count,
        emailsCancelled: 0,
        enrollmentsCancelled: 0,
        threadsArchived: 0,
    };
}
