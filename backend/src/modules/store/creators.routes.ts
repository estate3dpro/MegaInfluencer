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
            affiliateLinks: {
              where: { organizationId: org.id },
              select: { id: true, status: true },
            },
            affiliateCommissions: {
              where: { organizationId: org.id },
              select: { orderAmount: true, amount: true, status: true },
            },
          },
        },
      },
    });

    return {
      creators: rows.map((row: any) => {
        const inf = row.influencer;
        const commissions = (inf.affiliateCommissions ?? []).filter((c: any) => c.status !== 'REVERSED');
        const totalSales = commissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount || 0), 0);
        const totalCommissions = commissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
        const totalOrders = commissions.length;
        const activeLinks = (inf.affiliateLinks ?? []).filter((l: any) => l.status === 'ACTIVE').length;

        return {
          id: inf.id,
          displayName: inf.displayName,
          email: inf.email,
          status: inf.status,
          creatorCode: inf.creatorCode,
          assignedAt: row.createdAt,
          instagramUsername: inf.instagramConnection?.username ?? null,
          instagramStatus: inf.instagramConnection?.status ?? null,
          totalSales,
          totalOrders,
          totalCommissions,
          activeLinks,
        };
      }),
    };
  });

  // GET unassigned creators available to partner with
  app.get('/store/creators/available', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);

    const assigned = await prisma.storeInfluencerAssignment.findMany({
      where: { organizationId: org.id },
      select: { influencerId: true },
    });
    const assignedIds = assigned.map((a: any) => a.influencerId);

    const available = await prisma.user.findMany({
      where: {
        role: 'INFLUENCER',
        id: { notIn: assignedIds.length > 0 ? assignedIds : ['none'] },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        creatorCode: true,
        instagramConnection: { select: { username: true, displayName: true, status: true } },
      },
      take: 20,
    });

    return {
      creators: available.map((u: any) => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        creatorCode: u.creatorCode,
        instagramUsername: u.instagramConnection?.username ?? null,
      })),
    };
  });

  // POST assign a creator to the store
  app.post('/store/creators/assign', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const body = req.body as { influencerId?: string; creatorCode?: string };
    if (!body?.influencerId) {
      throw new AppError('INFLUENCER_ID_REQUIRED', 'influencerId is required', 400);
    }

    const influencer = await prisma.user.findUnique({
      where: { id: body.influencerId, role: 'INFLUENCER' },
    });
    if (!influencer) {
      throw new AppError('INFLUENCER_NOT_FOUND', 'Influencer not found', 404);
    }

    // Upsert assignment
    const assignment = await prisma.storeInfluencerAssignment.upsert({
      where: {
        organizationId_influencerId: {
          organizationId: org.id,
          influencerId: body.influencerId,
        },
      },
      create: {
        organizationId: org.id,
        influencerId: body.influencerId,
      },
      update: {},
    });

    return { ok: true, assignment };
  });

  // GET store commissions roster
  app.get('/store/commissions', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const query = req.query as { status?: string; search?: string };

    const where: any = { organizationId: org.id };
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { creator: { displayName: { contains: query.search, mode: 'insensitive' } } },
        { creator: { creatorCode: { contains: query.search, mode: 'insensitive' } } },
        { shopifyOrder: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [rows, allCommissions] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              email: true,
              creatorCode: true,
              instagramConnection: { select: { username: true } },
            },
          },
          shopifyOrder: {
            select: {
              id: true,
              name: true,
              total: true,
              processedAt: true,
              financialStatus: true,
            },
          },
        },
      }),
      prisma.affiliateCommission.findMany({
        where: { organizationId: org.id },
        select: { amount: true, status: true },
      }),
    ]);

    const pendingAmount = allCommissions
      .filter((c: any) => c.status === 'PENDING')
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const approvedAmount = allCommissions
      .filter((c: any) => c.status === 'APPROVED')
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const paidAmount = allCommissions
      .filter((c: any) => c.status === 'PAID')
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

    return {
      commissions: rows.map((r: any) => ({
        id: r.id,
        orderId: r.shopifyOrderId,
        orderNumber: r.shopifyOrder?.name ?? `#${r.shopifyOrderId.slice(-6)}`,
        orderAmount: Number(r.orderAmount),
        commissionRate: Number(r.commissionRate),
        amount: Number(r.amount),
        status: r.status,
        createdAt: r.createdAt,
        creator: r.creator
          ? {
              id: r.creator.id,
              name: r.creator.displayName,
              email: r.creator.email,
              code: r.creator.creatorCode,
              instagram: r.creator.instagramConnection?.username ?? null,
            }
          : null,
      })),
      metrics: {
        pendingAmount,
        approvedAmount,
        paidAmount,
        totalCount: allCommissions.length,
      },
    };
  });

  // PATCH /store/commissions/:commissionId/status
  app.patch('/store/commissions/:commissionId/status', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { commissionId } = req.params as { commissionId: string };
    const body = req.body as { status: 'PENDING' | 'APPROVED' | 'PAID' | 'REVERSED' };

    if (!['PENDING', 'APPROVED', 'PAID', 'REVERSED'].includes(body.status)) {
      throw new AppError('INVALID_STATUS', 'Status must be PENDING, APPROVED, PAID, or REVERSED', 400);
    }

    const existing = await prisma.affiliateCommission.findFirst({
      where: { id: commissionId, organizationId: org.id },
    });
    if (!existing) {
      throw new AppError('COMMISSION_NOT_FOUND', 'Commission not found', 404);
    }

    const updated = await prisma.affiliateCommission.update({
      where: { id: commissionId },
      data: { status: body.status },
    });

    return { ok: true, commission: updated };
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
