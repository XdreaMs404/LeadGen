import type { IcpConfig as PrismaIcpConfig, Prospect as PrismaProspect, Sequence as PrismaSequence, SequenceStep as PrismaSequenceStep, OpenerCache as PrismaOpenerCache, Campaign as PrismaCampaign, CampaignProspect as PrismaCampaignProspect, SendingSettings as PrismaSendingSettings, ScheduledEmail as PrismaScheduledEmail, SentEmail as PrismaSentEmail, Conversation as PrismaConversation, InboxMessage as PrismaInboxMessage } from '@prisma/client';
import type { IcpConfig } from '@/types/icp';
import type { Prospect } from '@/types/prospect';
import type { Sequence, SequenceStep, SequenceListItem } from '@/types/sequence';
import type { OpenerCacheData } from '@/types/opener';
import type { CampaignResponse, CampaignProspectResponse } from '@/types/campaign';
import type { SendingSettingsResponse } from '@/types/sending-settings';
import type { ScheduledEmailResponse } from '@/types/scheduled-email';
import type { SentEmailResponse } from '@/types/sent-email';
import type { Conversation, ConversationWithProspect, InboxMessage, ConversationWithMessages } from '@/types/inbox';

/**
 * Transform Prisma SendingSettings model to frontend-friendly JSON
 */
export function mapSendingSettings(prismaSettings: PrismaSendingSettings): SendingSettingsResponse {
    return {
        id: prismaSettings.id,
        workspaceId: prismaSettings.workspaceId,
        sendingDays: prismaSettings.sendingDays as number[],
        startHour: prismaSettings.startHour,
        endHour: prismaSettings.endHour,
        timezone: prismaSettings.timezone,
        dailyQuota: prismaSettings.dailyQuota,
        rampUpEnabled: prismaSettings.rampUpEnabled,
        fromName: prismaSettings.fromName,
        signature: prismaSettings.signature,
        createdAt: prismaSettings.createdAt.toISOString(),
        updatedAt: prismaSettings.updatedAt.toISOString(),
    };
}

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
        description: prismaSequence.description,
        isTemplate: prismaSequence.isTemplate,
        sourceTemplateId: prismaSequence.sourceTemplateId,
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
        description: prismaSequence.description,
        isTemplate: prismaSequence.isTemplate,
        sourceTemplateId: prismaSequence.sourceTemplateId,
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

/**
 * Transform Prisma Campaign model to frontend-friendly JSON
 */
export function mapCampaign(
    prismaCampaign: PrismaCampaign & {
        sequence?: { id: string; name: string } | null;
        _count?: { prospects: number };
        prospects?: { enrollmentStatus: string }[];
        stats?: CampaignResponse['stats'];
    }
): CampaignResponse {
    // Calculate enrollment counts if prospects are included
    let enrollmentCounts: CampaignResponse['enrollmentCounts'] | undefined;
    if (prismaCampaign.prospects) {
        const counts = {
            total: prismaCampaign.prospects.length,
            enrolled: 0,
            paused: 0,
            completed: 0,
            stopped: 0,
            replied: 0,
        };
        prismaCampaign.prospects.forEach((p) => {
            switch (p.enrollmentStatus) {
                case 'ENROLLED': counts.enrolled++; break;
                case 'PAUSED': counts.paused++; break;
                case 'COMPLETED': counts.completed++; break;
                case 'STOPPED': counts.stopped++; break;
                case 'REPLIED': counts.replied++; break;
            }
        });
        enrollmentCounts = counts;
    } else if (prismaCampaign._count?.prospects !== undefined) {
        enrollmentCounts = {
            total: prismaCampaign._count.prospects,
            enrolled: 0,
            paused: 0,
            completed: 0,
            stopped: 0,
            replied: 0,
        };
    }

    return {
        id: prismaCampaign.id,
        workspaceId: prismaCampaign.workspaceId,
        name: prismaCampaign.name,
        sequenceId: prismaCampaign.sequenceId,
        status: prismaCampaign.status,
        createdAt: prismaCampaign.createdAt.toISOString(),
        startedAt: prismaCampaign.startedAt?.toISOString() ?? null,
        pausedAt: prismaCampaign.pausedAt?.toISOString() ?? null,
        completedAt: prismaCampaign.completedAt?.toISOString() ?? null,
        stoppedAt: prismaCampaign.stoppedAt?.toISOString() ?? null,
        autoPausedReason: prismaCampaign.autoPausedReason ?? null,
        enrollmentCounts,
        stats: prismaCampaign.stats,
        sequence: prismaCampaign.sequence ?? undefined,
    };
}

/**
 * Transform Prisma CampaignProspect model to frontend-friendly JSON
 */
export function mapCampaignProspect(
    prismaCampaignProspect: PrismaCampaignProspect & {
        prospect?: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            company: string | null;
        };
    }
): CampaignProspectResponse {
    return {
        id: prismaCampaignProspect.id,
        campaignId: prismaCampaignProspect.campaignId,
        prospectId: prismaCampaignProspect.prospectId,
        enrollmentStatus: prismaCampaignProspect.enrollmentStatus,
        currentStep: prismaCampaignProspect.currentStep,
        enrolledAt: prismaCampaignProspect.enrolledAt.toISOString(),
        pausedAt: prismaCampaignProspect.pausedAt?.toISOString() ?? null,
        completedAt: prismaCampaignProspect.completedAt?.toISOString() ?? null,
        prospect: prismaCampaignProspect.prospect,
    };
}

/**
 * Transform Prisma ScheduledEmail model to frontend-friendly JSON
 */
export function mapScheduledEmail(prismaScheduledEmail: PrismaScheduledEmail): ScheduledEmailResponse {
    return {
        id: prismaScheduledEmail.id,
        workspaceId: prismaScheduledEmail.workspaceId,
        campaignId: prismaScheduledEmail.campaignId,
        campaignProspectId: prismaScheduledEmail.campaignProspectId,
        prospectId: prismaScheduledEmail.prospectId,
        sequenceId: prismaScheduledEmail.sequenceId,
        stepNumber: prismaScheduledEmail.stepNumber,
        idempotencyKey: prismaScheduledEmail.idempotencyKey,
        status: prismaScheduledEmail.status,
        scheduledFor: prismaScheduledEmail.scheduledFor.toISOString(),
        attempts: prismaScheduledEmail.attempts,
        lastError: prismaScheduledEmail.lastError,
        nextRetryAt: prismaScheduledEmail.nextRetryAt?.toISOString() ?? null,
        messageId: prismaScheduledEmail.messageId,
        threadId: prismaScheduledEmail.threadId,
        sentAt: prismaScheduledEmail.sentAt?.toISOString() ?? null,
        createdAt: prismaScheduledEmail.createdAt.toISOString(),
        updatedAt: prismaScheduledEmail.updatedAt.toISOString(),
    };
}

/**
 * Transform Prisma SentEmail model to frontend-friendly JSON
 */
export function mapSentEmail(prismaSentEmail: PrismaSentEmail): SentEmailResponse {
    return {
        id: prismaSentEmail.id,
        workspaceId: prismaSentEmail.workspaceId,
        scheduledEmailId: prismaSentEmail.scheduledEmailId,
        campaignId: prismaSentEmail.campaignId,
        prospectId: prismaSentEmail.prospectId,
        messageId: prismaSentEmail.messageId,
        threadId: prismaSentEmail.threadId,
        subject: prismaSentEmail.subject,
        toAddress: prismaSentEmail.toAddress,
        headers: prismaSentEmail.headers as Record<string, string> | null,
        sentAt: prismaSentEmail.sentAt.toISOString(),
        createdAt: prismaSentEmail.createdAt.toISOString(),
    };
}

/**
 * Transform Prisma Conversation model to frontend-friendly JSON
 */
export function mapConversation(
    prismaConversation: PrismaConversation & {
        messages?: PrismaInboxMessage[];
    }
): Conversation {
    return {
        id: prismaConversation.id,
        threadId: prismaConversation.threadId,
        workspaceId: prismaConversation.workspaceId,
        prospectId: prismaConversation.prospectId,
        campaignId: prismaConversation.campaignId,
        sequenceId: prismaConversation.sequenceId,
        status: prismaConversation.status,
        lastMessageAt: prismaConversation.lastMessageAt.toISOString(),
        createdAt: prismaConversation.createdAt.toISOString(),
        updatedAt: prismaConversation.updatedAt.toISOString(),
        messages: prismaConversation.messages?.map(mapInboxMessage),
    };
}

/**
 * Transform Prisma Conversation with prospect info for list view
 */
export function mapConversationWithProspect(
    prismaConversation: PrismaConversation & {
        prospect?: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            company: string | null;
        } | null;
        campaign?: {
            id: string;
            name: string;
        } | null;
        messages?: PrismaInboxMessage[];
    }
): ConversationWithProspect {
    return {
        ...mapConversation(prismaConversation),
        prospect: prismaConversation.prospect ?? null,
        campaign: prismaConversation.campaign ?? null,
    };
}

/**
 * Transform Prisma InboxMessage model to frontend-friendly JSON
 */
export function mapInboxMessage(prismaMessage: PrismaInboxMessage): InboxMessage {
    return {
        id: prismaMessage.id,
        conversationId: prismaMessage.conversationId,
        gmailMessageId: prismaMessage.gmailMessageId,
        direction: prismaMessage.direction,
        subject: prismaMessage.subject,
        bodyRaw: prismaMessage.bodyRaw,
        bodyCleaned: prismaMessage.bodyCleaned,
        fromEmail: prismaMessage.fromEmail,
        toEmail: prismaMessage.toEmail,
        receivedAt: prismaMessage.receivedAt.toISOString(),
        classification: prismaMessage.classification,
        isRead: prismaMessage.isRead,
        createdAt: prismaMessage.createdAt.toISOString(),
    };
}

/**
 * Transform Prisma Conversation with full context (messages, prospect, campaign)
 */
export function mapConversationWithMessages(
    prismaConversation: PrismaConversation & {
        prospect?: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            company: string | null;
            title?: string | null;
        } | null;
        campaign?: {
            id: string;
            name: string;
            status?: string;
            sequence?: {
                id: string;
                name: string;
            };
        } | null;
        messages?: PrismaInboxMessage[];
    }
): ConversationWithMessages {
    return {
        ...mapConversation(prismaConversation),
        prospect: prismaConversation.prospect ? {
            ...prismaConversation.prospect,
            jobTitle: prismaConversation.prospect.title,
        } : null,
        campaign: prismaConversation.campaign ? {
            id: prismaConversation.campaign.id,
            name: prismaConversation.campaign.name,
            status: prismaConversation.campaign.status,
        } : null,
        sequence: prismaConversation.campaign?.sequence ? {
            id: prismaConversation.campaign.sequence.id,
            name: prismaConversation.campaign.sequence.name,
        } : null,
        messages: prismaConversation.messages?.map(mapInboxMessage) ?? [],
    };
}
