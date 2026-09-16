CREATE TABLE "ShopifyProduct" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "status" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "descriptionHtml" TEXT,
    "imageUrl" TEXT,
    "inventoryTotal" INTEGER NOT NULL DEFAULT 0,
    "price" TEXT,
    "currency" TEXT,
    "payload" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShopifyProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShopifyProduct_organizationId_shopifyId_key" ON "ShopifyProduct"("organizationId", "shopifyId");
CREATE INDEX "ShopifyProduct_organizationId_syncedAt_idx" ON "ShopifyProduct"("organizationId", "syncedAt");
ALTER TABLE "ShopifyProduct" ADD CONSTRAINT "ShopifyProduct_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
