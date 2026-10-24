-- AlterTable
ALTER TABLE "ShopifyOrder"
ADD COLUMN IF NOT EXISTS "isAttributionLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "attributionMethod" TEXT,
ADD COLUMN IF NOT EXISTS "attributionEvidence" JSONB,
ADD COLUMN IF NOT EXISTS "attributionLockedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "tamperFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "tamperDetails" JSONB;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ShopifyOrder_organizationId_tamperFlagged_idx" ON "ShopifyOrder"("organizationId", "tamperFlagged");

-- CreateTable
CREATE TABLE IF NOT EXISTS "OrderAttributionAudit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "fromCreatorId" TEXT,
    "toCreatorId" TEXT,
    "fromCode" TEXT,
    "toCode" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAttributionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderAttributionAudit_organizationId_shopifyOrderId_idx" ON "OrderAttributionAudit"("organizationId", "shopifyOrderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderAttributionAudit_shopifyOrderId_createdAt_idx" ON "OrderAttributionAudit"("shopifyOrderId", "createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderAttributionAudit_organizationId_fkey') THEN
        ALTER TABLE "OrderAttributionAudit" ADD CONSTRAINT "OrderAttributionAudit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderAttributionAudit_shopifyOrderId_fkey') THEN
        ALTER TABLE "OrderAttributionAudit" ADD CONSTRAINT "OrderAttributionAudit_shopifyOrderId_fkey" FOREIGN KEY ("shopifyOrderId") REFERENCES "ShopifyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
