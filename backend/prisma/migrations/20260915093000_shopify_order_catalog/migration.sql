CREATE TABLE "ShopifyOrder" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "shopifyId" TEXT NOT NULL,
  "name" TEXT NOT NULL, "email" TEXT, "currency" TEXT, "total" TEXT,
  "financialStatus" TEXT, "fulfillmentStatus" TEXT, "processedAt" TIMESTAMP(3),
  "payload" JSONB NOT NULL, "syncedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShopifyOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ShopifyOrder_organizationId_shopifyId_key" ON "ShopifyOrder"("organizationId", "shopifyId");
CREATE INDEX "ShopifyOrder_organizationId_syncedAt_idx" ON "ShopifyOrder"("organizationId", "syncedAt");
ALTER TABLE "ShopifyOrder" ADD CONSTRAINT "ShopifyOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
