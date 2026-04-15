-- AlterTable
ALTER TABLE "Artifact" ADD COLUMN IF NOT EXISTS "sharedToFeedAt" TIMESTAMP(3);
