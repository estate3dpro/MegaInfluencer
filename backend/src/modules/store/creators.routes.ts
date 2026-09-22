import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { decryptToken } from '../instagram/instagram.crypto.js';
import { getInstagramProfile } from '../instagram/instagram.client.js';
import { getAssignedProductIds, setCreatorProductAssignments } from '../product-assignments/product-assignments.service.js';

export const storeCreatorsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  async function organization(userId: string) {
    const org = await prisma.organization.findFirst({ where: { ownerId: userId }, select: { id: true, name: true } });
    if (!org) throw new AppError('STORE_NOT_FOUND', 'Store not found.', 404);
    return org;
  }

  app.get('/store/creators', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const rows = await prisma.storeInfluencerAssignment.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      include: {
        influencer: {
          select: {
            id: true,
            displayName: true,
            email: true,
            status: true,
            creatorCode: true,
            createdAt: true,
            instagramConnection: { select: { username: true, displayName: true, status: true } },
          },
        },
      },
    });
    return {
      creators: rows.map((row: any) => ({
        ...row.influencer,
        assignedAt: row.createdAt,
        instagramUsername: row.influencer.instagramConnection?.username ?? null,
        instagramStatus: row.influencer.instagramConnection?.status ?? null,
      })),
    };
  });

  app.get('/store/creators/:creatorId', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };
    const assignment = await prisma.storeInfluencerAssignment.findFirst({
      where: { organizationId: org.id, influencerId: creatorId },
      include: { influencer: { include: { instagramConnection: true } } },
    });
    if (!assignment) throw new AppError('CREATOR_NOT_FOUND', 'Creator is not assigned to this store.', 404);
    let instagramStatistics = null;
    if (assignment.influencer.instagramConnection?.status === 'ACTIVE') {
      try {
        instagramStatistics = await getInstagramProfile(decryptToken(assignment.influencer.instagramConnection.encryptedAccessToken));
      } catch {
        /* profile remains available when Meta stats cannot be fetched */
      }
    }
    return { creator: assignment.influencer, assignedAt: assignment.createdAt, instagramStatistics };
  });

  // GET store products and assignment state for this creator
  app.get('/store/creators/:creatorId/products', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };

    const [allProducts, assignedProductIds] = await Promise.all([
      prisma.shopifyProduct.findMany({
        where: { organizationId: org.id },
        orderBy: { title: 'asc' },
        select: {
          id: true,
          title: true,
          price: true,
          imageUrl: true,
          handle: true,
          vendor: true,
        },
      }),
      getAssignedProductIds(prisma, creatorId, org.id),
    ]);

    const assignedSet = new Set(assignedProductIds);

    return {
      products: allProducts.map((p: any) => ({
        ...p,
        isAssigned: assignedSet.has(p.id),
      })),
      assignedCount: assignedSet.size,
    };
  });

  // PUT update assigned products for this creator
  app.put('/store/creators/:creatorId/products', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };
    const body = req.body as { productIds?: string[] };
    const productIds = Array.isArray(body?.productIds) ? body.productIds : [];

    // Verify creator is assigned to store
    const storeAssignment = await prisma.storeInfluencerAssignment.findFirst({
      where: { organizationId: org.id, influencerId: creatorId },
    });
    if (!storeAssignment) {
      throw new AppError('CREATOR_NOT_ASSIGNED', 'Creator must first be assigned to this store.', 400);
    }

    const assignedCount = await setCreatorProductAssignments(prisma, org.id, creatorId, productIds);

    return { ok: true, assignedCount };
  });
};
