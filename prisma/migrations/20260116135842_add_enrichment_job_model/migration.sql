-- CreateEnum
CREATE TYPE "enrichment_job_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "prospects" ADD COLUMN     "enriched_at" TIMESTAMP(3),
ADD COLUMN     "enrichment_data" JSONB,
ADD COLUMN     "enrichment_source" TEXT;

-- CreateTable
CREATE TABLE "enrichment_jobs" (
    "id" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "request_id" TEXT,
    "status" "enrichment_job_status" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "enrichment_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enrichment_jobs_workspace_id_status_idx" ON "enrichment_jobs"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "enrichment_jobs_next_retry_at_status_idx" ON "enrichment_jobs"("next_retry_at", "status");

-- AddForeignKey
ALTER TABLE "enrichment_jobs" ADD CONSTRAINT "enrichment_jobs_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrichment_jobs" ADD CONSTRAINT "enrichment_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
