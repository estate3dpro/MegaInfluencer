-- AlterTable
ALTER TABLE "InstagramAutomation" ADD COLUMN IF NOT EXISTS "fallbackMessage" TEXT,
ADD COLUMN IF NOT EXISTS "fallbackEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "InstagramAutomationDelivery" ADD COLUMN IF NOT EXISTS "fallbackSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "fallbackMessage" TEXT,
ADD COLUMN IF NOT EXISTS "fallbackError" TEXT,
ADD COLUMN IF NOT EXISTS "fallbackSentAt" TIMESTAMP(3);
