export interface ProductAssignmentRecord {
  id: string;
  organizationId: string;
  productId: string;
  influencerId: string;
  createdAt: Date;
}

let tableEnsured = false;

function resolvePrisma(prismaOrApp: any) {
  return prismaOrApp?.prisma || prismaOrApp;
}

export async function ensureProductAssignmentsTable(prismaOrApp: any) {
  if (tableEnsured) return;
  const prisma = resolvePrisma(prismaOrApp);
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
  prismaOrApp: any,
  influencerId: string,
  organizationId?: string
): Promise<string[]> {
  try {
    const prisma = resolvePrisma(prismaOrApp);
    await ensureProductAssignmentsTable(prisma);

    const rows = await prisma.productInfluencerAssignment.findMany({
      where: {
        influencerId,
        ...(organizationId ? { organizationId } : {}),
      },
      select: { productId: true },
    });
    return rows.map((r: any) => r.productId);
  } catch (error) {
    console.error('Error fetching assigned product IDs:', error);
    return [];
  }
}

export async function setCreatorProductAssignments(
  prismaOrApp: any,
  organizationId: string,
  influencerId: string,
  productIds: string[]
): Promise<string[]> {
  const prisma = resolvePrisma(prismaOrApp);
  await ensureProductAssignmentsTable(prisma);

  await prisma.productInfluencerAssignment.deleteMany({
    where: { organizationId, influencerId },
  });

  if (productIds.length > 0) {
    await prisma.productInfluencerAssignment.createMany({
      data: productIds.map((productId) => ({
        organizationId,
        productId,
        influencerId,
      })),
      skipDuplicates: true,
    });
  }

  return productIds;
}

