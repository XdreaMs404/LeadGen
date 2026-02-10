
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
    console.log('--- DIAGNOSTIC EMAIL SENDING (SIMPLE) ---');

    try {
        // 1. Check ScheduledEmail Count
        const count = await prisma.scheduledEmail.count();
        console.log(`Total ScheduledEmails: ${count}`);

        const pending = await prisma.scheduledEmail.findMany({
            take: 5,
            orderBy: { scheduledFor: 'asc' }
        });

        console.log(`First 5 ScheduledEmails:`);
        pending.forEach(e => {
            console.log(` - ID: ${e.id}, Status: ${e.status}, Time: ${e.scheduledFor}`);
        });

        // 2. Check Settings
        const settings = await prisma.sendingSettings.findFirst();
        if (settings) {
            console.log(`\nSettings found: DailyQuota=${settings.dailyQuota}`);
        } else {
            console.log('\nNo SendingSettings found.');
        }

    } catch (error) {
        console.error('ERROR:', error);
    }
}

checkStatus()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
