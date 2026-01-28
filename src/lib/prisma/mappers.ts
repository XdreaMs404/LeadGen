import type { IcpConfig as PrismaIcpConfig, Prospect as PrismaProspect, Sequence as PrismaSequence, SequenceStep as PrismaSequenceStep, OpenerCache as PrismaOpenerCache } from '@prisma/client';
import type { IcpConfig } from '@/types/icp';
import type { Prospect } from '@/types/prospect';
import type { Sequence, SequenceStep, SequenceListItem } from '@/types/sequence';
import type { OpenerCacheData } from '@/types/opener';

/**
 * Transform Prisma IcpConfig model to frontend-friendly JSON
 */
export function mapIcpConfig(prismaIcp: PrismaIcpConfig): IcpConfig {
    return {
        id: prismaIcp.id,
        workspaceId: prismaIcp.workspaceId,
        industries: prismaIcp.industries,
        companySizes: prismaIcp.companySizes as IcpConfig['companySizes'],
        roles: prismaIcp.roles,
        locations: prismaIcp.locations,
        createdAt: prismaIcp.createdAt.toISOString(),
        updatedAt: prismaIcp.updatedAt.toISOString(),
    };
}

/**
 * Transform Prisma Prospect model to frontend-friendly JSON
 */
export function mapProspect(prismaProspect: PrismaProspect): Prospect {
    return {
        id: prismaProspect.id,
        workspaceId: prismaProspect.workspaceId,
        email: prismaProspect.email,
        firstName: prismaProspect.firstName,
        lastName: prismaProspect.lastName,
        company: prismaProspect.company,
        title: prismaProspect.title,
        phone: prismaProspect.phone,
        linkedinUrl: prismaProspect.linkedinUrl,
        source: prismaProspect.source,
        sourceDetail: prismaProspect.sourceDetail,
        status: prismaProspect.status,
        enrichmentSource: prismaProspect.enrichmentSource,
        enrichedAt: prismaProspect.enrichedAt?.toISOString() ?? null,
        enrichmentData: prismaProspect.enrichmentData as Record<string, unknown> | null,
        createdAt: prismaProspect.createdAt.toISOString(),
        updatedAt: prismaProspect.updatedAt.toISOString(),
        deletedAt: prismaProspect.deletedAt?.toISOString() ?? null,
        deletedBy: prismaProspect.deletedBy,
    };
}

/**
 * Transform Prisma SequenceStep model to frontend-friendly JSON
 */
export function mapSequenceStep(prismaStep: PrismaSequenceStep): SequenceStep {
    return {
        id: prismaStep.id,
        sequenceId: prismaStep.sequenceId,
        order: prismaStep.order,
        subject: prismaStep.subject,
        body: prismaStep.body,
        delayDays: prismaStep.delayDays,
        createdAt: prismaStep.createdAt.toISOString(),
        updatedAt: prismaStep.updatedAt.toISOString(),
    };
}

/**
 * Transform Prisma Sequence model to frontend-friendly JSON (with steps)
 */
export function mapSequence(prismaSequence: PrismaSequence & { steps?: PrismaSequenceStep[] }): Sequence {
    return {
        id: prismaSequence.id,
        workspaceId: prismaSequence.workspaceId,
        name: prismaSequence.name,
        status: prismaSequence.status,
        steps: prismaSequence.steps?.map(mapSequenceStep) ?? [],
        createdAt: prismaSequence.createdAt.toISOString(),
        updatedAt: prismaSequence.updatedAt.toISOString(),
    };
}

/**
 * Transform Prisma Sequence with step count for list view
 */
export function mapSequenceListItem(prismaSequence: PrismaSequence & { _count?: { steps: number } }): SequenceListItem {
    return {
        id: prismaSequence.id,
        workspaceId: prismaSequence.workspaceId,
        name: prismaSequence.name,
        status: prismaSequence.status,
        stepsCount: prismaSequence._count?.steps ?? 0,
        createdAt: prismaSequence.createdAt.toISOString(),
        updatedAt: prismaSequence.updatedAt.toISOString(),
    };
}

/**
 * Transform Prisma OpenerCache model to frontend-friendly JSON
 */
export function mapOpenerCache(prismaOpenerCache: PrismaOpenerCache, maxRegenerations: number = 3): OpenerCacheData {
    return {
        id: prismaOpenerCache.id,
        workspaceId: prismaOpenerCache.workspaceId,
        prospectId: prismaOpenerCache.prospectId,
        sequenceId: prismaOpenerCache.sequenceId,
        stepId: prismaOpenerCache.stepId,
        openerText: prismaOpenerCache.openerText,
        regenerationCount: prismaOpenerCache.regenerationCount,
        regenerationsRemaining: maxRegenerations - prismaOpenerCache.regenerationCount,
        createdAt: prismaOpenerCache.createdAt.toISOString(),
        updatedAt: prismaOpenerCache.updatedAt.toISOString(),
    };
}
