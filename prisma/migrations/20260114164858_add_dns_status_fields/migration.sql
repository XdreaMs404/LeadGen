-- CreateEnum
CREATE TYPE "dns_status" AS ENUM ('NOT_STARTED', 'PASS', 'FAIL', 'UNKNOWN', 'MANUAL_OVERRIDE');

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "dkim_selector" TEXT,
ADD COLUMN     "dkim_status" "dns_status" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "dmarc_status" "dns_status" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "spf_status" "dns_status" NOT NULL DEFAULT 'NOT_STARTED';
