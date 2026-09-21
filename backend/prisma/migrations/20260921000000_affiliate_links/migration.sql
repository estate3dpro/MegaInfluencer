CREATE TYPE "AffiliateLinkStatus" AS ENUM ('ACTIVE', 'PAUSED');
CREATE TYPE "AffiliateLinkTargetType" AS ENUM ('STORE', 'PRODUCT');
CREATE TYPE "AffiliateCommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REVERSED');

CREATE TABLE "AffiliateLink" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "productId" TEXT,
  "slug" TEXT NOT NULL,
  "targetType" "AffiliateLinkTargetType" NOT NULL DEFAULT 'STORE',
  "destinationPath" TEXT NOT NULL DEFAULT '/',
  "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
  "status" "AffiliateLinkStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AffiliateLink_slug_key" ON "AffiliateLink"("slug");
CREATE INDEX "AffiliateLink_organizationId_status_idx" ON "AffiliateLink"("organizationId", "status");
CREATE INDEX "AffiliateLink_creatorId_createdAt_idx" ON "AffiliateLink"("creatorId", "createdAt");
CREATE INDEX "AffiliateLink_productId_idx" ON "AffiliateLink"("productId");

CREATE TABLE "AffiliateLinkClick" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "linkId" TEXT NOT NULL,
  "visitorHash" TEXT,
  "referrer" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AffiliateLinkClick_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AffiliateLinkClick_linkId_createdAt_idx" ON "AffiliateLinkClick"("linkId", "createdAt");
CREATE INDEX "AffiliateLinkClick_organizationId_createdAt_idx" ON "AffiliateLinkClick"("organizationId", "createdAt");

CREATE TABLE "AffiliateCommission" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "linkId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "shopifyOrderId" TEXT NOT NULL,
  "orderAmount" DECIMAL(12,2) NOT NULL,
  "commissionRate" DECIMAL(5,2) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "status" "AffiliateCommissionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AffiliateCommission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AffiliateCommission_shopifyOrderId_key" ON "AffiliateCommission"("shopifyOrderId");
CREATE INDEX "AffiliateCommission_organizationId_creatorId_status_idx" ON "AffiliateCommission"("organizationId", "creatorId", "status");

ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopifyProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AffiliateLinkClick" ADD CONSTRAINT "AffiliateLinkClick_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateLinkClick" ADD CONSTRAINT "AffiliateLinkClick_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "AffiliateLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "AffiliateLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_shopifyOrderId_fkey" FOREIGN KEY ("shopifyOrderId") REFERENCES "ShopifyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
