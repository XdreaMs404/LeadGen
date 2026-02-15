/**
 * Classification Auto-Actions (Story 6.4 AC4)
 */

import { prisma } from '@/lib/prisma/client';
import type { InboxMessage, ReplyClassification } from '@prisma/client';

async function stopProspectEnrollments(prospectId: string): Promise<void> {
    await prisma.campaignProspect.updateMany({
        where: {
            prospectId,
            enrollmentStatus: { not: 'STOPPED' },
        },
        data: {
            enrollmentStatus: 'STOPPED',
        },
    });
}

async function cancelScheduledForProspect(prospectId: string): Promise<void> {
    await prisma.scheduledEmail.updateMany({
        where: {
            prospectId,
            status: {
                in: ['SCHEDULED', 'RETRY_SCHEDULED'],
            },
        },
        data: {
            status: 'CANCELLED',
        },
    });
}

async function createProspectAuditLog(
    workspaceId: string,
    userId: string,
    prospectId: string,
    action: 'PROSPECT_UNSUBSCRIBED' | 'PROSPECT_BOUNCED',
    messageId: string,
    conversationId: string
): Promise<void> {
    await prisma.auditLog.create({
        data: {
            workspaceId,
            userId,
            action,
            entityType: 'PROSPECT',
            entityId: prospectId,
            metadata: {
                source: 'inbox-classification',
                messageId,
                conversationId,
                createdAt: new Date().toISOString(),
            },
        },
    });
}

/**
 * Execute side-effects based on message classification.
 */
export async function handleClassificationActions(
    message: Pick<InboxMessage, 'id'>,
    classification: ReplyClassification,
    conversationId: string
): Promise<void> {
    if (!['UNSUBSCRIBE', 'BOUNCE', 'INTERESTED'].includes(classification)) {
        return;
    }

    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: {
            id: true,
            workspaceId: true,
            prospectId: true,
            campaignId: true,
            workspace: {
                select: {
                    userId: true,
                },
            },
        },
    });

    if (!conversation?.prospectId) {
        return;
    }

    const { prospectId, workspaceId } = conversation;
    const userId = conversation.workspace.userId;

    if (classification === 'UNSUBSCRIBE') {
        await prisma.prospect.updateMany({
            where: {
                id: prospectId,
                status: { not: 'UNSUBSCRIBED' },
            },
            data: { status: 'UNSUBSCRIBED' },
        });

        await stopProspectEnrollments(prospectId);
        await cancelScheduledForProspect(prospectId);
        await createProspectAuditLog(
            workspaceId,
            userId,
            prospectId,
            'PROSPECT_UNSUBSCRIBED',
            message.id,
            conversationId
        );
        return;
    }

    if (classification === 'BOUNCE') {
        await prisma.prospect.updateMany({
            where: {
                id: prospectId,
                status: { not: 'BOUNCED' },
            },
            data: { status: 'BOUNCED' },
        });

        await stopProspectEnrollments(prospectId);
        await cancelScheduledForProspect(prospectId);
        await createProspectAuditLog(
            workspaceId,
            userId,
            prospectId,
            'PROSPECT_BOUNCED',
            message.id,
            conversationId
        );
        return;
    }

    await prisma.campaignProspect.updateMany({
        where: {
            prospectId,
            ...(conversation.campaignId ? { campaignId: conversation.campaignId } : {}),
            enrollmentStatus: {
                in: ['ENROLLED', 'PAUSED'],
            },
        },
        data: {
            enrollmentStatus: 'REPLIED',
        },
    });
}
