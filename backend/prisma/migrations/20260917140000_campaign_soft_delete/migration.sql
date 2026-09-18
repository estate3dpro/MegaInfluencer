ALTER TABLE "Campaign" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Campaign_organizationId_deletedAt_idx"
ON "Campaign"("organizationId", "deletedAt");
