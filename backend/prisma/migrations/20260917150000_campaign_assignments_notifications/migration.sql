CREATE TABLE "CampaignAssignment" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "influencerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampaignAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'CAMPAIGN',
  "link" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CampaignAssignment_campaignId_influencerId_key" ON "CampaignAssignment"("campaignId", "influencerId");
CREATE INDEX "CampaignAssignment_influencerId_status_idx" ON "CampaignAssignment"("influencerId", "status");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

ALTER TABLE "CampaignAssignment" ADD CONSTRAINT "CampaignAssignment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignAssignment" ADD CONSTRAINT "CampaignAssignment_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
