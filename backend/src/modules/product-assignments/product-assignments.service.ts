export interface ProductAssignmentRecord {
  id: string;
  organizationId: string;
  productId: string;
  influencerId: string;
  createdAt: Date;
}

export async function getAssignedProductIds(
  prisma: any,
  influencerId: string,
  organizationId?: string
): Promise<string[]> {
  try {
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
