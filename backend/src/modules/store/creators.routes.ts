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

  // GET /store/creators
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
            instagramConnection: { select: { username: true, displayName: true, status: true, encryptedAccessToken: true } },
            affiliateLinks: {
              where: { organizationId: org.id },
              select: { id: true, status: true },
            },
            affiliateCommissions: {
              where: { organizationId: org.id },
              select: { orderAmount: true, amount: true, status: true },
            },
            barterFulfillments: {
              where: { organizationId: org.id },
              select: { id: true, productTitle: true, status: true, trackingNumber: true, carrier: true },
            },
          },
        },
      },
    });

    return {
      creators: await Promise.all(rows.map(async (row: any) => {
        const inf = row.influencer;
        const commissions = (inf.affiliateCommissions ?? []).filter((c: any) => c.status !== 'REVERSED');
        const totalSales = commissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount || 0), 0);
        const totalCommissions = commissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
        const totalOrders = commissions.length;
        const activeLinks = (inf.affiliateLinks ?? []).filter((l: any) => l.status === 'ACTIVE').length;

        let instagramStatistics = null;
        if (inf.instagramConnection?.status === 'ACTIVE') {
          try {
            instagramStatistics = await getInstagramProfile(decryptToken(inf.instagramConnection.encryptedAccessToken));
          } catch {
            /* Instagram statistics optional */
          }
        }

        const mode = row.compensationMode || 'COMMISSION'; // 'COMMISSION' | 'BARTER' | 'HYBRID'
        const samples = inf.barterFulfillments ?? [];

        return {
          id: inf.id,
          displayName: inf.displayName,
          email: inf.email,
          status: inf.status,
          creatorCode: inf.creatorCode,
          assignedAt: row.createdAt,
          instagramUsername: inf.instagramConnection?.username ?? null,
          instagramStatus: inf.instagramConnection?.status ?? null,
          instagramFollowersCount: instagramStatistics?.followers_count ?? null,
          instagramMediaCount: instagramStatistics?.media_count ?? null,
          totalSales,
          totalOrders,
          totalCommissions: mode === 'BARTER' ? 0 : totalCommissions,
          compensationMode: mode,
          barterOrders: mode === 'BARTER' ? totalOrders : 0,
          barterGmv: mode === 'BARTER' ? totalSales : 0,
          activeLinks,
          sampleCount: samples.length,
          recentSample: samples[0] || null,
        };
      })),
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
        status: 'ACTIVE',
        id: { notIn: assignedIds.length ? assignedIds : ['none'] },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        creatorCode: true,
        influencerProfile: {
          select: { firstName: true, lastName: true, bio: true, city: true },
        },
        instagramConnection: {
          select: { username: true, status: true },
        },
      },
    });

    return { creators: available };
  });

  // POST /store/creators/assign
  app.post('/store/creators/assign', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const body = req.body as { influencerId: string; compensationMode?: string };

    if (!body.influencerId) {
      throw new AppError('MISSING_INFLUENCER_ID', 'influencerId is required', 400);
    }

    const influencer = await prisma.user.findUnique({
      where: { id: body.influencerId, role: 'INFLUENCER' },
    });
    if (!influencer) {
      throw new AppError('INFLUENCER_NOT_FOUND', 'Influencer not found', 404);
    }

    const mode = ['COMMISSION', 'BARTER', 'HYBRID'].includes(body.compensationMode ?? '')
      ? body.compensationMode
      : 'COMMISSION';

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
        compensationMode: mode,
      },
      update: {
        compensationMode: mode,
      },
    });

    return { ok: true, assignment };
  });

  // PATCH /store/creators/:creatorId/compensation-mode (Supports COMMISSION, BARTER, HYBRID)
  app.patch('/store/creators/:creatorId/compensation-mode', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };
    const { compensationMode } = req.body as { compensationMode?: string };

    if (!['COMMISSION', 'BARTER', 'HYBRID'].includes(compensationMode ?? '')) {
      throw new AppError('INVALID_COMPENSATION_MODE', 'compensationMode must be COMMISSION, BARTER, or HYBRID', 400);
    }

    const assignment = await prisma.storeInfluencerAssignment.updateMany({
      where: { organizationId: org.id, influencerId: creatorId },
      data: { compensationMode },
    });
    if (!assignment.count) {
      throw new AppError('CREATOR_NOT_FOUND', 'Creator is not assigned to this store.', 404);
    }

    return { ok: true, compensationMode };
  });

  // POST /store/creators/:creatorId/barter-sample (Send or update product sample tracking)
  app.post('/store/creators/:creatorId/barter-sample', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };
    const body = req.body as {
      productTitle: string;
      productId?: string;
      carrier?: string;
      trackingNumber?: string;
      shippingAddress?: string;
      status?: string;
    };

    if (!body.productTitle?.trim()) {
      throw new AppError('MISSING_PRODUCT_TITLE', 'Product title is required', 400);
    }

    // Find default or first campaign to attach
    let campaign = await prisma.campaign.findFirst({
      where: { organizationId: org.id, deletedAt: null },
    });

    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: {
          organizationId: org.id,
          title: `${org.name} Product Sampling`,
          brief: 'Complimentary brand sample gifted to creator partner.',
          category: 'Fashion & Lifestyle',
          campaignType: 'BARTER',
          objective: 'Product Review & Social Shoutout',
          deliverables: '1 Instagram Reel or Story Review',
          compensationType: 'BARTER',
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'PUBLISHED',
        },
      });
    }

    const sample = await prisma.barterSampleFulfillment.create({
      data: {
        organizationId: org.id,
        campaignId: campaign.id,
        creatorId,
        productId: body.productId || null,
        productTitle: body.productTitle.trim(),
        carrier: body.carrier || 'Standard Courier',
        trackingNumber: body.trackingNumber || null,
        shippingAddress: body.shippingAddress || null,
        status: (body.status as any) || 'SHIPPED',
        shippedAt: new Date(),
      },
    });

    // Notify creator
    await prisma.notification.create({
      data: {
        userId: creatorId,
        title: '🎁 Product Sample Dispatched!',
        message: `${org.name} has shipped your free sample of "${body.productTitle}"${body.trackingNumber ? ` via ${body.carrier || 'courier'} (Tracking: ${body.trackingNumber})` : ''}.`,
        kind: 'BARTER',
      },
    });

    return { ok: true, sample };
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

    const [rows, allCommissions, assignments] = await Promise.all([
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
          shopifyOrder: { select: { id: true, name: true, total: true, processedAt: true } },
          link: { select: { slug: true, commissionRate: true } },
        },
      }),
      prisma.affiliateCommission.findMany({
        where: { organizationId: org.id },
        select: { amount: true, status: true, orderAmount: true },
      }),
      prisma.storeInfluencerAssignment.findMany({
        where: { organizationId: org.id },
        select: { influencerId: true, compensationMode: true },
      }),
    ]);

    const barterMap = new Map(assignments.map((a: any) => [a.influencerId, a.compensationMode]));
    const payoutCommissions = allCommissions.filter((c: any) => c.status !== 'REVERSED');

    const pendingAmount = payoutCommissions
      .filter((c: any) => c.status === 'PENDING')
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const approvedAmount = payoutCommissions
      .filter((c: any) => c.status === 'APPROVED')
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const paidAmount = payoutCommissions
      .filter((c: any) => c.status === 'PAID')
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

    return {
      commissions: rows.map((r: any) => {
        const creatorMode = r.creatorId ? (barterMap.get(r.creatorId) || 'COMMISSION') : 'COMMISSION';
        return {
          id: r.id,
          orderId: r.shopifyOrderId,
          orderName: r.shopifyOrder?.name ?? `Order #${r.id.slice(-6)}`,
          orderAmount: Number(r.orderAmount),
          commissionRate: Number(r.commissionRate),
          amount: Number(r.amount),
          status: r.status,
          createdAt: r.createdAt,
          creatorMode,
          creator: r.creator
            ? {
                id: r.creator.id,
                name: r.creator.displayName,
                email: r.creator.email,
                code: r.creator.creatorCode,
                instagram: r.creator.instagramConnection?.username ?? null,
              }
            : null,
        };
      }),
      metrics: {
        pendingAmount,
        approvedAmount,
        paidAmount,
        totalCount: payoutCommissions.length,
        pendingCount: payoutCommissions.filter((c: any) => c.status === 'PENDING').length,
      },
    };
  });

  // POST /store/commissions/bulk-approve (1-Click approve all pending commissions)
  app.post('/store/commissions/bulk-approve', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);

    const pendingCommissions = await prisma.affiliateCommission.findMany({
      where: { organizationId: org.id, status: 'PENDING' },
    });

    if (!pendingCommissions.length) {
      return { ok: true, count: 0, message: 'No pending commissions to approve.' };
    }

    await prisma.affiliateCommission.updateMany({
      where: { organizationId: org.id, status: 'PENDING' },
      data: { status: 'APPROVED' },
    });

    // Notify affected creators
    const creatorIds = [...new Set(pendingCommissions.map((c: any) => c.creatorId).filter(Boolean))];
    for (const creatorId of creatorIds) {
      await prisma.notification.create({
        data: {
          userId: creatorId as string,
          title: '🎉 Commissions Approved!',
          message: `${org.name} has approved your pending sales commissions. Funds are now available for withdrawal!`,
          kind: 'COMMISSION',
        },
      });
    }

    return {
      ok: true,
      count: pendingCommissions.length,
      message: `Successfully approved ${pendingCommissions.length} pending commissions!`,
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

  // GET /store/creators/:creatorId
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
        /* profile remains available */
      }
    }
    const assignedProductIds = await getAssignedProductIds(app, org.id, creatorId);
    return {
      creator: {
        id: assignment.influencer.id,
        displayName: assignment.influencer.displayName,
        email: assignment.influencer.email,
        creatorCode: assignment.influencer.creatorCode,
        instagramUsername: assignment.influencer.instagramConnection?.username ?? null,
        instagramFollowersCount: instagramStatistics?.followers_count ?? null,
        assignedProductIds,
        compensationMode: assignment.compensationMode ?? 'COMMISSION',
      },
    };
  });

  // PUT /store/creators/:creatorId/products
  app.put('/store/creators/:creatorId/products', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };
    const { productIds } = req.body as { productIds: string[] };
    if (!Array.isArray(productIds)) throw new AppError('INVALID_INPUT', 'productIds must be an array', 400);
    const assignedProductIds = await setCreatorProductAssignments(app, org.id, creatorId, productIds);
    return { ok: true, assignedProductIds };
  });
};
