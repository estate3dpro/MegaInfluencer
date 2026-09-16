CREATE TYPE "StorePlatform" AS ENUM ('SHOPIFY', 'WOOCOMMERCE', 'CUSTOM');
CREATE TYPE "StoreConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'DISABLED');
CREATE TYPE "ShopifyConnectionMethod" AS ENUM ('CLI_APP', 'ADMIN_API');

ALTER TABLE "Organization"
  ADD COLUMN "apiUrl" TEXT,
  ADD COLUMN "appUrl" TEXT,
  ADD COLUMN "category" TEXT,
  ADD COLUMN "connectionStatus" "StoreConnectionStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "platform" "StorePlatform" NOT NULL DEFAULT 'SHOPIFY',
  ADD COLUMN "shopDomain" TEXT,
  ADD COLUMN "shopifyConnectionMethod" "ShopifyConnectionMethod",
  ADD COLUMN "encryptedShopifyAccessToken" TEXT;

CREATE TABLE "StoreInfluencerAssignment" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "influencerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreInfluencerAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StoreInfluencerAssignment_influencerId_idx" ON "StoreInfluencerAssignment"("influencerId");
CREATE UNIQUE INDEX "StoreInfluencerAssignment_organizationId_influencerId_key" ON "StoreInfluencerAssignment"("organizationId", "influencerId");

ALTER TABLE "StoreInfluencerAssignment" ADD CONSTRAINT "StoreInfluencerAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreInfluencerAssignment" ADD CONSTRAINT "StoreInfluencerAssignment_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
