// This script is to check Prisma instantiation in a clean Node environment
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Attempting to connect...')
    try {
        await prisma.$connect()
        console.log('Successfully connected!')
        const count = await prisma.user.count()
        console.log('User count:', count)
    } catch (e) {
        console.error('Connection failed:', e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
