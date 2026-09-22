-- CreateEnum
CREATE TYPE "InstagramAutomationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "InstagramAutomationDelivery" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "commenterId" TEXT NOT NULL,
    "commenterName" TEXT,
    "commentText" TEXT NOT NULL,
    "status" "InstagramAutomationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramAutomationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramAutomationDelivery_automationId_commentId_key" ON "InstagramAutomationDelivery"("automationId", "commentId");

-- CreateIndex
CREATE INDEX "InstagramAutomationDelivery_automationId_createdAt_idx" ON "InstagramAutomationDelivery"("automationId", "createdAt");

-- CreateIndex
CREATE INDEX "InstagramAutomationDelivery_status_createdAt_idx" ON "InstagramAutomationDelivery"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "InstagramAutomationDelivery" ADD CONSTRAINT "InstagramAutomationDelivery_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "InstagramAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
