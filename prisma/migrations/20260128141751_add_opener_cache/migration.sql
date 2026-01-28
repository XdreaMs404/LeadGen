-- CreateTable
CREATE TABLE "opener_cache" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "opener_text" TEXT NOT NULL,
    "regeneration_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opener_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opener_cache_workspace_id_idx" ON "opener_cache"("workspace_id");

-- CreateIndex
CREATE INDEX "opener_cache_prospect_id_idx" ON "opener_cache"("prospect_id");

-- CreateIndex
CREATE INDEX "opener_cache_sequence_id_idx" ON "opener_cache"("sequence_id");

-- CreateIndex
CREATE UNIQUE INDEX "opener_cache_workspace_id_prospect_id_sequence_id_step_id_key" ON "opener_cache"("workspace_id", "prospect_id", "sequence_id", "step_id");

-- AddForeignKey
ALTER TABLE "opener_cache" ADD CONSTRAINT "opener_cache_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opener_cache" ADD CONSTRAINT "opener_cache_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opener_cache" ADD CONSTRAINT "opener_cache_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opener_cache" ADD CONSTRAINT "opener_cache_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "sequence_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
