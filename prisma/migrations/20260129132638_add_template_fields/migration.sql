-- AlterTable
ALTER TABLE "sequences" ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_template" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source_template_id" TEXT;

-- CreateIndex
CREATE INDEX "sequences_is_template_idx" ON "sequences"("is_template");
