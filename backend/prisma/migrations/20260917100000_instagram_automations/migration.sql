-- CreateEnum
CREATE TYPE "InstagramAutomationStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "InstagramAutomation" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instagramPostId" TEXT NOT NULL,
    "postUrl" TEXT,
    "postLabel" TEXT,
    "keywords" TEXT[] NOT NULL,
    "dmMessage" TEXT NOT NULL,
    "wholeWordMatch" BOOLEAN NOT NULL DEFAULT true,
    "status" "InstagramAutomationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstagramAutomation_influencerId_createdAt_idx" ON "InstagramAutomation"("influencerId", "createdAt");

-- CreateIndex
CREATE INDEX "InstagramAutomation_influencerId_instagramPostId_idx" ON "InstagramAutomation"("influencerId", "instagramPostId");

-- AddForeignKey
ALTER TABLE "InstagramAutomation" ADD CONSTRAINT "InstagramAutomation_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
