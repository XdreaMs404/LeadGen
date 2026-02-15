-- Story 6.4: AI reply classification with confidence

-- CreateEnum (safe for repeated local runs)
DO $$ BEGIN
    CREATE TYPE "classification_method" AS ENUM ('RULE', 'LLM', 'MANUAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum
ALTER TYPE "reply_classification" ADD VALUE IF NOT EXISTS 'NOT_NOW';
ALTER TYPE "reply_classification" ADD VALUE IF NOT EXISTS 'NEGATIVE';
ALTER TYPE "reply_classification" ADD VALUE IF NOT EXISTS 'NEEDS_REVIEW';

-- AlterTable
ALTER TABLE "inbox_messages"
    ADD COLUMN IF NOT EXISTS "confidence_score" INTEGER,
    ADD COLUMN IF NOT EXISTS "classification_method" "classification_method",
    ADD COLUMN IF NOT EXISTS "needs_review" BOOLEAN NOT NULL DEFAULT false;

-- Keep confidence in 0..100 for data quality
DO $$ BEGIN
    ALTER TABLE "inbox_messages"
        ADD CONSTRAINT "inbox_messages_confidence_score_check"
        CHECK ("confidence_score" IS NULL OR ("confidence_score" >= 0 AND "confidence_score" <= 100));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
