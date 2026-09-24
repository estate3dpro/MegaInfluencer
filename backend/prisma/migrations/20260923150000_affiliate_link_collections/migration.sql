ALTER TYPE "AffiliateLinkTargetType" ADD VALUE 'COLLECTION';

CREATE TABLE "AffiliateLinkProduct" (
  "id" TEXT NOT NULL,
  "affiliateLinkId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AffiliateLinkProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AffiliateLinkProduct_affiliateLinkId_productId_key" ON "AffiliateLinkProduct"("affiliateLinkId", "productId");
CREATE INDEX "AffiliateLinkProduct_productId_idx" ON "AffiliateLinkProduct"("productId");
CREATE INDEX "AffiliateLinkProduct_affiliateLinkId_position_idx" ON "AffiliateLinkProduct"("affiliateLinkId", "position");

ALTER TABLE "AffiliateLinkProduct"
  ADD CONSTRAINT "AffiliateLinkProduct_affiliateLinkId_fkey"
  FOREIGN KEY ("affiliateLinkId") REFERENCES "AffiliateLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateLinkProduct"
  ADD CONSTRAINT "AffiliateLinkProduct_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "ShopifyProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
