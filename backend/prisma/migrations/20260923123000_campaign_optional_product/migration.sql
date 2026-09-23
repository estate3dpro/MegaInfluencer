ALTER TABLE "Campaign" ADD COLUMN "productId" TEXT;
CREATE INDEX "Campaign_productId_idx" ON "Campaign"("productId");
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopifyProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
