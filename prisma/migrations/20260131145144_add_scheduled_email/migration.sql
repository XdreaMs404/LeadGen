-- CreateEnum
CREATE TYPE "scheduled_email_status" AS ENUM ('SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'RETRY_SCHEDULED', 'PERMANENTLY_FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "scheduled_emails" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "campaign_prospect_id" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" "scheduled_email_status" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_retry_at" TIMESTAMP(3),
    "message_id" TEXT,
    "thread_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_emails_idempotency_key_key" ON "scheduled_emails"("idempotency_key");

-- CreateIndex
CREATE INDEX "scheduled_emails_workspace_id_idx" ON "scheduled_emails"("workspace_id");

-- CreateIndex
CREATE INDEX "scheduled_emails_status_idx" ON "scheduled_emails"("status");

-- CreateIndex
CREATE INDEX "scheduled_emails_scheduled_for_idx" ON "scheduled_emails"("scheduled_for");

-- CreateIndex
CREATE INDEX "scheduled_emails_next_retry_at_status_idx" ON "scheduled_emails"("next_retry_at", "status");

-- CreateIndex
CREATE INDEX "scheduled_emails_campaign_id_idx" ON "scheduled_emails"("campaign_id");

-- AddForeignKey
ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_campaign_prospect_id_fkey" FOREIGN KEY ("campaign_prospect_id") REFERENCES "campaign_prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "sequences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
