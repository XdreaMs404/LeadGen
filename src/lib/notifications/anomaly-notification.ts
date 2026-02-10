import { prisma } from '@/lib/prisma/client';
import { AnomalyResult, AutoPauseReason } from '@/types/anomaly-detection';

/**
 * Create a notification for an anomaly event
 */
export async function createAnomalyNotification(
    result: AnomalyResult,
    workspaceId: string
): Promise<void> {
    // Only create notifications for warnings or pauses
    if (!result.shouldWarn && !result.shouldPause) return;

    const type = result.shouldPause ? 'ANOMALY_PAUSE' : 'ANOMALY_WARNING';
    const severity = result.severity || (result.shouldPause ? 'ERROR' : 'WARNING');

    // Construct a meaningful title
    const title = result.reason
        ? getTitleForReason(result.reason)
        : 'Anomalie détectée';

    await prisma.notification.create({
        data: {
            workspaceId,
            type,
            severity,
            title,
            message: result.message || `Anomalie détectée sur la campagne ${result.campaignName}`,
            metadata: {
                campaignId: result.campaignId,
                campaignName: result.campaignName,
                reason: result.reason,
                metrics: result.metrics as any
            },
            isRead: false
        }
    });

    console.log(`[Notification] Created ${severity} notification: ${title} for campaign ${result.campaignName}`);
}

function getTitleForReason(reason: AutoPauseReason): string {
    switch (reason) {
        case 'HIGH_BOUNCE_RATE':
            return 'Taux de rebond critique';
        case 'HIGH_UNSUBSCRIBE_RATE':
            return 'Taux de désabonnement critique';
        case 'HIGH_COMPLAINT_RATE':
            return 'Taux de plaintes critique';
        default:
            return 'Problème de délivrabilité';
    }
}
