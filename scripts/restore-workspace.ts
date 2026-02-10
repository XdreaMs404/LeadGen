
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for users without workspaces...');

    const users = await prisma.user.findMany({
        include: {
            workspaces: true,
        },
    });

    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        if (user.workspaces.length === 0) {
            console.log(`User ${user.email} (${user.id}) has no workspace. Creating one...`);

            const workspace = await prisma.workspace.create({
                data: {
                    name: `${user.name || 'User'}'s Workspace`,
                    userId: user.id,
                    onboardingComplete: true, // Assuming they were already using it
                },
            });

            console.log(`Created workspace: ${workspace.id}`);
        } else {
            console.log(`User ${user.email} already has ${user.workspaces.length} workspace(s).`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
