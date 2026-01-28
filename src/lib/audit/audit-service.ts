/**
 * Audit Service
 * Story 3.6: Immutable audit logs for compliance
 */
import { prisma } from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';
import type { CascadeSummary } from '@/lib/prospects/cascade-delete-service';

export type AuditAction =
    | 'PROSPECT_DELETED'
    | 'PROSPECT_BULK_DELETED'
    | 'CAMPAIGN_LAUNCHED'
    | 'CAMPAIGN_PAUSED'
    | 'EMAIL_SENT';

export type AuditEntityType = 'PROSPECT' | 'CAMPAIGN' | 'EMAIL' | 'SEQUENCE';

interface AuditLogEntry {
    workspaceId: string;
    userId: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    metadata?: Prisma.InputJsonValue;
}

/**
 * Create an immutable audit log entry
 * Audit logs are never updated or deleted (NFR25: 3 year retention)
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
    await prisma.auditLog.create({
        data: {
            workspaceId: entry.workspaceId,
            userId: entry.userId,
            action: entry.action,
            entityType: entry.entityType,
            entityId: entry.entityId,
            metadata: entry.metadata,
        },
    });
}

/**
 * Log a prospect deletion with cascade summary
 */
export async function logProspectDeletion(
    prospectId: string,
    userId: string,
    workspaceId: string,
    cascadeSummary: CascadeSummary
): Promise<void> {
    await createAuditLog({
        workspaceId,
        userId,
        action: 'PROSPECT_DELETED',
        entityType: 'PROSPECT',
        entityId: prospectId,
        metadata: {
            cascade: {
                enrichmentJobsCancelled: cascadeSummary.enrichmentJobsCancelled,
                emailsCancelled: cascadeSummary.emailsCancelled,
                enrollmentsCancelled: cascadeSummary.enrollmentsCancelled,
                threadsArchived: cascadeSummary.threadsArchived,
            },
            deletedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
    });
}

/**
 * Log a bulk prospect deletion
 */
export async function logBulkProspectDeletion(
    prospectIds: string[],
    userId: string,
    workspaceId: string,
    cascadeSummary: CascadeSummary
): Promise<void> {
    await createAuditLog({
        workspaceId,
        userId,
        action: 'PROSPECT_BULK_DELETED',
        entityType: 'PROSPECT',
        entityId: prospectIds.join(','),
        metadata: {
            count: prospectIds.length,
            prospectIds: prospectIds,
            cascade: {
                enrichmentJobsCancelled: cascadeSummary.enrichmentJobsCancelled,
                emailsCancelled: cascadeSummary.emailsCancelled,
                enrollmentsCancelled: cascadeSummary.enrollmentsCancelled,
                threadsArchived: cascadeSummary.threadsArchived,
            },
            deletedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
    });
}

