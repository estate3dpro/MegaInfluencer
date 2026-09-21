import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running product influencer assignment table migration...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProductInfluencerAssignment" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "influencerId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProductInfluencerAssignment_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "ProductInfluencerAssignment_productId_influencerId_key" ON "ProductInfluencerAssignment"("productId", "influencerId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ProductInfluencerAssignment_influencerId_idx" ON "ProductInfluencerAssignment"("influencerId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ProductInfluencerAssignment_organizationId_idx" ON "ProductInfluencerAssignment"("organizationId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ProductInfluencerAssignment_productId_idx" ON "ProductInfluencerAssignment"("productId");
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductInfluencerAssignment_organizationId_fkey') THEN
            ALTER TABLE "ProductInfluencerAssignment" ADD CONSTRAINT "ProductInfluencerAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductInfluencerAssignment_productId_fkey') THEN
            ALTER TABLE "ProductInfluencerAssignment" ADD CONSTRAINT "ProductInfluencerAssignment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopifyProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductInfluencerAssignment_influencerId_fkey') THEN
            ALTER TABLE "ProductInfluencerAssignment" ADD CONSTRAINT "ProductInfluencerAssignment_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END $$;
  `);

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
