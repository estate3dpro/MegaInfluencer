ALTER TABLE "User" ADD COLUMN "creatorCode" TEXT;
ALTER TABLE "ShopifyOrder" ADD COLUMN "creatorCode" TEXT;

CREATE UNIQUE INDEX "User_creatorCode_key" ON "User"("creatorCode");
CREATE INDEX "ShopifyOrder_organizationId_creatorCode_idx" ON "ShopifyOrder"("organizationId", "creatorCode");
