-- CreateEnum
CREATE TYPE "auto_pause_reason" AS ENUM ('HIGH_BOUNCE_RATE', 'HIGH_UNSUBSCRIBE_RATE', 'HIGH_COMPLAINT_RATE');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "auto_paused_reason" "auto_pause_reason";
