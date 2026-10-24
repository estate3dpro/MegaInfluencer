import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating ShopifyOrder table with attribution security columns...');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ShopifyOrder"
    ADD COLUMN IF NOT EXISTS "isAttributionLocked" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "attributionMethod" TEXT,
    ADD COLUMN IF NOT EXISTS "attributionEvidence" JSONB,
    ADD COLUMN IF NOT EXISTS "attributionLockedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "tamperFlagged" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "tamperDetails" JSONB;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ShopifyOrder_organizationId_tamperFlagged_idx"
    ON "ShopifyOrder"("organizationId", "tamperFlagged");
  `);

  console.log('Creating OrderAttributionAudit ledger table...');

  await prisma.$executeRawUnsafe(`
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
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "OrderAttributionAudit_organizationId_shopifyOrderId_idx"
    ON "OrderAttributionAudit"("organizationId", "shopifyOrderId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "OrderAttributionAudit_shopifyOrderId_createdAt_idx"
    ON "OrderAttributionAudit"("shopifyOrderId", "createdAt");
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderAttributionAudit_organizationId_fkey') THEN
            ALTER TABLE "OrderAttributionAudit" ADD CONSTRAINT "OrderAttributionAudit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderAttributionAudit_shopifyOrderId_fkey') THEN
            ALTER TABLE "OrderAttributionAudit" ADD CONSTRAINT "OrderAttributionAudit_shopifyOrderId_fkey" FOREIGN KEY ("shopifyOrderId") REFERENCES "ShopifyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END $$;
  `);

  // Lock existing orders that already have a creatorCode or affiliateLinkId
  console.log('Backfilling lock on existing attributed orders...');
  await prisma.$executeRawUnsafe(`
    UPDATE "ShopifyOrder"
    SET 
      "isAttributionLocked" = true,
      "attributionLockedAt" = COALESCE("processedAt", "createdAt"),
      "attributionMethod" = 'LEGACY_SYNC'
    WHERE ("creatorCode" IS NOT NULL OR "affiliateLinkId" IS NOT NULL)
      AND "isAttributionLocked" = false;
  `);

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
