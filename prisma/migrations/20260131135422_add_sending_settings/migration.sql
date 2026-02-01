-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_sequence_id_fkey";

-- AlterTable
ALTER TABLE "campaigns" ALTER COLUMN "sequence_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "sending_settings" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "sending_days" JSONB NOT NULL DEFAULT '[1,2,3,4,5]',
    "start_hour" INTEGER NOT NULL DEFAULT 9,
    "end_hour" INTEGER NOT NULL DEFAULT 18,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "daily_quota" INTEGER NOT NULL DEFAULT 30,
    "ramp_up_enabled" BOOLEAN NOT NULL DEFAULT true,
    "from_name" TEXT,
    "signature" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sending_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sending_settings_workspace_id_key" ON "sending_settings"("workspace_id");

-- AddForeignKey
ALTER TABLE "sending_settings" ADD CONSTRAINT "sending_settings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "sequences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
