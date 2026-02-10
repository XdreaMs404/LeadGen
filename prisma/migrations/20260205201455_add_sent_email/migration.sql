-- CreateTable
CREATE TABLE "sent_emails" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "scheduled_email_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "headers" JSONB,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sent_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sent_emails_scheduled_email_id_key" ON "sent_emails"("scheduled_email_id");

-- CreateIndex
CREATE INDEX "sent_emails_workspace_id_idx" ON "sent_emails"("workspace_id");

-- CreateIndex
CREATE INDEX "sent_emails_campaign_id_idx" ON "sent_emails"("campaign_id");

-- CreateIndex
CREATE INDEX "sent_emails_prospect_id_idx" ON "sent_emails"("prospect_id");

-- CreateIndex
CREATE INDEX "sent_emails_thread_id_idx" ON "sent_emails"("thread_id");

-- AddForeignKey
ALTER TABLE "sent_emails" ADD CONSTRAINT "sent_emails_scheduled_email_id_fkey" FOREIGN KEY ("scheduled_email_id") REFERENCES "scheduled_emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sent_emails" ADD CONSTRAINT "sent_emails_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sent_emails" ADD CONSTRAINT "sent_emails_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
