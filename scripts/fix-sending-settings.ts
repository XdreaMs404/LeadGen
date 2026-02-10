
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for workspaces without SendingSettings...');

    const workspaces = await prisma.workspace.findMany({
        include: {
            sendingSettings: true,
        },
    });

    console.log(`Found ${workspaces.length} workspaces.`);

    for (const workspace of workspaces) {
        if (!workspace.sendingSettings) {
            console.log(`Workspace ${workspace.id} (${workspace.name}) has no SendingSettings. Creating default settings...`);

            const settings = await prisma.sendingSettings.create({
                data: {
                    workspaceId: workspace.id,
                    sendingDays: [1, 2, 3, 4, 5], // Mon-Fri
                    startHour: 9,
                    endHour: 18,
                    timezone: 'Europe/Paris',
                    dailyQuota: 30,
                    rampUpEnabled: true,
                },
            });

            console.log(`Created SendingSettings: ${settings.id}`);
        } else {
            console.log(`Workspace ${workspace.id} already has SendingSettings.`);
        }
    }

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
