
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStatus() {
    console.log('--- DIAGNOSTIC EMAIL SENDING ---');

    // 1. Check Pending Emails
    const pending = await prisma.scheduledEmail.findMany({
        where: {
            status: { in: ['SCHEDULED', 'RETRY_SCHEDULED'] },
            scheduledFor: { lte: new Date() }
        },
        take: 5,
        include: {
            campaign: { select: { status: true } },
            campaignProspect: { select: { enrollmentStatus: true } }
        }
    });

    console.log(`\n1. EMAILS EN ATTENTE (Status=SCHEDULED, Date <= Maintenant): ${pending.length}`);
    if (pending.length > 0) {
        pending.forEach(e => {
            console.log(`   - Email ${e.id}: ScheduledFor=${e.scheduledFor.toISOString()}, CampStatus=${e.campaign.status}, ProspectStatus=${e.campaignProspect.enrollmentStatus}`);
        });
    } else {
        // Check limits if scheduled in future
        const future = await prisma.scheduledEmail.count({
            where: { status: 'SCHEDULED', scheduledFor: { gt: new Date() } }
        });
        console.log(`   (Il y a ${future} emails planifiés dans le futur)`);
    }

    // 2. Check Quota
    console.log('\n2. QUOTAS (SendingSettings du Workspace)');
    const settings = await prisma.sendingSettings.findFirst();
    if (settings) {
        console.log(`   - Max par jour: ${settings.dailyQuota}`);
        const sentToday = await prisma.sentEmail.count({
            where: {
                sentAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        });
        console.log(`   - Envoyés aujourd'hui: ${sentToday}`);
        console.log(`   - Restant: ${Math.max(0, settings.dailyQuota - sentToday)}`);
    } else {
        console.log('   Warning: Pas de SendingSettings trouvés !');
    }

    // 3. Check Errors
    const errors = await prisma.scheduledEmail.findMany({
        where: { status: 'FAILED' },
        take: 3,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, lastError: true, attempts: true }
    });

    if (errors.length > 0) {
        console.log('\n3. DERNIÈRES ERREURS (FAILED)');
        errors.forEach(e => console.log(`   - Email ${e.id}: ${e.lastError} (Attempts: ${e.attempts})`));
    }
}

checkStatus()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
