
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAndTest() {
    console.log('--- NETTOYAGE ET TEST ---');

    try {
        // 1. Delete all existing scheduled emails
        const deleted = await prisma.scheduledEmail.deleteMany({});
        console.log(`Supprimé ${deleted.count} scheduled emails`);

        // 2. Show remaining campaigns
        const campaigns = await prisma.campaign.findMany({
            where: { status: 'RUNNING' },
            include: {
                campaignProspects: {
                    where: { enrollmentStatus: 'ENROLLED' }
                }
            }
        });

        console.log(`\nCampagnes RUNNING: ${campaigns.length}`);
        campaigns.forEach(c => {
            console.log(` - ${c.name}: ${c.campaignProspects.length} prospects enrolled`);
        });

        console.log('\n✅ Base nettoyée. Tu peux maintenant relancer une campagne depuis l\'UI pour tester.');

    } catch (error) {
        console.error('ERROR:', error);
    }
}

cleanAndTest()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
