-- CreateEnum
CREATE TYPE "prospect_source" AS ENUM ('CRM_EXPORT', 'EVENT_CONFERENCE', 'NETWORK_REFERRAL', 'CONTENT_DOWNLOAD', 'OUTBOUND_RESEARCH', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "prospect_status" ADD VALUE 'ENRICHING';
ALTER TYPE "prospect_status" ADD VALUE 'VERIFIED';
ALTER TYPE "prospect_status" ADD VALUE 'NOT_VERIFIED';
ALTER TYPE "prospect_status" ADD VALUE 'NEEDS_REVIEW';
ALTER TYPE "prospect_status" ADD VALUE 'SUPPRESSED';

-- AlterTable
ALTER TABLE "prospects" ADD COLUMN     "company" TEXT,
ADD COLUMN     "linkedin_url" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "source" "prospect_source" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "source_detail" TEXT,
ADD COLUMN     "title" TEXT;
