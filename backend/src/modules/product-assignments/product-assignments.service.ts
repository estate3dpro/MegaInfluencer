export interface ProductAssignmentRecord {
  id: string;
  organizationId: string;
  productId: string;
  influencerId: string;
  createdAt: Date;
}

let tableEnsured = false;

export async function ensureProductAssignmentsTable(prisma: any) {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProductInfluencerAssignment" (
          "id" TEXT NOT NULL,
          "organizationId" TEXT NOT NULL,
          "productId" TEXT NOT NULL,
          "influencerId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ProductInfluencerAssignment_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "ProductInfluencerAssignment_productId_influencerId_key" ON "ProductInfluencerAssignment"("productId", "influencerId");
      CREATE INDEX IF NOT EXISTS "ProductInfluencerAssignment_influencerId_idx" ON "ProductInfluencerAssignment"("influencerId");
      CREATE INDEX IF NOT EXISTS "ProductInfluencerAssignment_organizationId_idx" ON "ProductInfluencerAssignment"("organizationId");
      CREATE INDEX IF NOT EXISTS "ProductInfluencerAssignment_productId_idx" ON "ProductInfluencerAssignment"("productId");
    `);
    tableEnsured = true;
  } catch (error) {
    console.error('Failed to ensure ProductInfluencerAssignment table:', error);
  }
}

export async function getAssignedProductIds(
  prisma: any,
  influencerId: string,
  organizationId?: string
): Promise<string[]> {
  try {
    await ensureProductAssignmentsTable(prisma);

    if (organizationId) {
      const rows = await prisma.$queryRaw`
        SELECT "productId" FROM "ProductInfluencerAssignment" 
        WHERE "influencerId" = ${influencerId} AND "organizationId" = ${organizationId}
      `;
      return Array.isArray(rows) ? rows.map((r: any) => r.productId) : [];
    }

    const rows = await prisma.$queryRaw`
      SELECT "productId" FROM "ProductInfluencerAssignment" 
      WHERE "influencerId" = ${influencerId}
    `;
    return Array.isArray(rows) ? rows.map((r: any) => r.productId) : [];
  } catch (error) {
    console.error('Error fetching assigned product IDs:', error);
    return [];
  }
}

export async function setCreatorProductAssignments(
  prisma: any,
  organizationId: string,
  influencerId: string,
  productIds: string[]
): Promise<number> {
  await ensureProductAssignmentsTable(prisma);

  await prisma.$executeRaw`
    DELETE FROM "ProductInfluencerAssignment" 
    WHERE "organizationId" = ${organizationId} AND "influencerId" = ${influencerId}
  `;

  for (const productId of productIds) {
    const id = `cpa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await prisma.$executeRaw`
      INSERT INTO "ProductInfluencerAssignment" ("id", "organizationId", "productId", "influencerId", "createdAt")
      VALUES (${id}, ${organizationId}, ${productId}, ${influencerId}, NOW())
      ON CONFLICT ("productId", "influencerId") DO NOTHING
    `;
  }

  return productIds.length;
}
