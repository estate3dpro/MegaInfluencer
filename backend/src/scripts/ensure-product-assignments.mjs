import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProductInfluencerAssignment" (
      "id" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "influencerId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "ProductInfluencerAssignment_pkey"
        PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS
      "ProductInfluencerAssignment_productId_influencerId_key"
    ON "ProductInfluencerAssignment" ("productId", "influencerId")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS
      "ProductInfluencerAssignment_productId_idx"
    ON "ProductInfluencerAssignment" ("productId")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS
      "ProductInfluencerAssignment_influencerId_idx"
    ON "ProductInfluencerAssignment" ("influencerId")
  `);

  console.log("ProductInfluencerAssignment table is ready.");
}

main()
  .catch((error) => {
    console.error("Failed to create assignment table:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });