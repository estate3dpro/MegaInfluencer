CREATE TABLE "ShopifyCollection" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "shopifyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "handle" TEXT,
  "descriptionHtml" TEXT,
  "imageUrl" TEXT,
  "productCount" INTEGER NOT NULL DEFAULT 0,
  "payload" JSONB NOT NULL,
  "syncedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShopifyCollection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShopifyCollectionProduct" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ShopifyCollectionProduct_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AffiliateLink" ADD COLUMN "collectionId" TEXT;

CREATE UNIQUE INDEX "ShopifyCollection_organizationId_shopifyId_key" ON "ShopifyCollection"("organizationId", "shopifyId");
CREATE INDEX "ShopifyCollection_organizationId_syncedAt_idx" ON "ShopifyCollection"("organizationId", "syncedAt");
CREATE UNIQUE INDEX "ShopifyCollectionProduct_collectionId_productId_key" ON "ShopifyCollectionProduct"("collectionId", "productId");
CREATE INDEX "ShopifyCollectionProduct_productId_idx" ON "ShopifyCollectionProduct"("productId");
CREATE INDEX "ShopifyCollectionProduct_collectionId_position_idx" ON "ShopifyCollectionProduct"("collectionId", "position");
CREATE INDEX "AffiliateLink_collectionId_idx" ON "AffiliateLink"("collectionId");

ALTER TABLE "ShopifyCollection" ADD CONSTRAINT "ShopifyCollection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopifyCollectionProduct" ADD CONSTRAINT "ShopifyCollectionProduct_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ShopifyCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopifyCollectionProduct" ADD CONSTRAINT "ShopifyCollectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopifyProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ShopifyCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
