import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { parseOrThrow } from '../../shared/validation/pagination.js';
import { updateReferralSettingsSchema } from './referral-settings.schema.js';

async function storeFor(app: Parameters<FastifyPluginAsync>[0], userId: string) {
  const store = await (app.prisma as any).organization.findFirst({
    where: { ownerId: userId },
    select: { id: true, name: true, slug: true, shopDomain: true },
  });
  if (!store) {
    throw new AppError('STORE_NOT_FOUND', 'No store found for this account.', 404);
  }
  return store;
}

export const storeReferralSettingsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  // GET /api/v1/store/referral-settings
  app.get('/store/referral-settings', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);

    let config = await prisma.storeReferralConfig.findUnique({
      where: { organizationId: store.id },
    });

    if (!config) {
      config = await prisma.storeReferralConfig.create({
        data: {
          organizationId: store.id,
          isEnabled: true,
          rewardMode: 'POINTS',
          percentageEnabled: true,
          commissionRate: 10,
          pointsPerCurrency: 1,
          spendTokensEnabled: false,
          spendTokensRate: 10,
          spendTokensAmount: 100,
          fixedTokensEnabled: false,
          fixedTokensPerOrder: 50,
          welcomeBonusEnabled: true,
          welcomeBonusPoints: 100,
          minPayoutAmount: 500,
          friendDiscountEnabled: true,
          friendDiscountType: 'PERCENTAGE',
          friendDiscountValue: 10,
          showTierRoadmap: true,
          showPerformanceCharts: true,
          showRewardsStore: true,
          showRecentPurchases: true,
          programTitle: 'Customer Advocate & Referral Rewards',
          customShareMessage: 'Get 10% off with my link, and support me!',
          accentColor: '#6c5ce7',
        },
      });
    }

    return {
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        shopDomain: store.shopDomain,
      },
      config: {
        id: config.id,
        organizationId: config.organizationId,
        isEnabled: config.isEnabled,
        rewardMode: config.rewardMode,
        percentageEnabled: config.percentageEnabled ?? true,
        commissionRate: Number(config.commissionRate),
        pointsPerCurrency: config.pointsPerCurrency,
        spendTokensEnabled: config.spendTokensEnabled ?? false,
        spendTokensRate: config.spendTokensRate ?? 10,
        spendTokensAmount: Number(config.spendTokensAmount ?? 100),
        fixedTokensEnabled: config.fixedTokensEnabled ?? false,
        fixedTokensPerOrder: config.fixedTokensPerOrder ?? 50,
        welcomeBonusEnabled: config.welcomeBonusEnabled ?? true,
        welcomeBonusPoints: config.welcomeBonusPoints,
        minPayoutAmount: Number(config.minPayoutAmount),
        friendDiscountEnabled: config.friendDiscountEnabled,
        friendDiscountType: config.friendDiscountType,
        friendDiscountValue: Number(config.friendDiscountValue),
        showTierRoadmap: config.showTierRoadmap,
        showPerformanceCharts: config.showPerformanceCharts,
        showRewardsStore: config.showRewardsStore,
        showRecentPurchases: config.showRecentPurchases,
        programTitle: config.programTitle,
        customShareMessage: config.customShareMessage,
        accentColor: config.accentColor,
        updatedAt: config.updatedAt,
      },
    };
  });

  // PATCH /api/v1/store/referral-settings
  app.patch('/store/referral-settings', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const input = parseOrThrow(updateReferralSettingsSchema, request.body);

    const updated = await prisma.storeReferralConfig.upsert({
      where: { organizationId: store.id },
      create: {
        organizationId: store.id,
        isEnabled: input.isEnabled ?? true,
        rewardMode: input.rewardMode ?? 'POINTS',
        percentageEnabled: input.percentageEnabled ?? true,
        commissionRate: input.commissionRate ?? 10,
        pointsPerCurrency: input.pointsPerCurrency ?? 1,
        spendTokensEnabled: input.spendTokensEnabled ?? false,
        spendTokensRate: input.spendTokensRate ?? 10,
        spendTokensAmount: input.spendTokensAmount ?? 100,
        fixedTokensEnabled: input.fixedTokensEnabled ?? false,
        fixedTokensPerOrder: input.fixedTokensPerOrder ?? 50,
        welcomeBonusEnabled: input.welcomeBonusEnabled ?? true,
        welcomeBonusPoints: input.welcomeBonusPoints ?? 100,
        minPayoutAmount: input.minPayoutAmount ?? 500,
        friendDiscountEnabled: input.friendDiscountEnabled ?? true,
        friendDiscountType: input.friendDiscountType ?? 'PERCENTAGE',
        friendDiscountValue: input.friendDiscountValue ?? 10,
        showTierRoadmap: input.showTierRoadmap ?? true,
        showPerformanceCharts: input.showPerformanceCharts ?? true,
        showRewardsStore: input.showRewardsStore ?? true,
        showRecentPurchases: input.showRecentPurchases ?? true,
        programTitle: input.programTitle ?? 'Customer Advocate & Referral Rewards',
        customShareMessage: input.customShareMessage ?? 'Get 10% off with my link, and support me!',
        accentColor: input.accentColor ?? '#6c5ce7',
      },
      update: {
        ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
        ...(input.rewardMode !== undefined ? { rewardMode: input.rewardMode } : {}),
        ...(input.percentageEnabled !== undefined ? { percentageEnabled: input.percentageEnabled } : {}),
        ...(input.commissionRate !== undefined ? { commissionRate: input.commissionRate } : {}),
        ...(input.pointsPerCurrency !== undefined ? { pointsPerCurrency: input.pointsPerCurrency } : {}),
        ...(input.spendTokensEnabled !== undefined ? { spendTokensEnabled: input.spendTokensEnabled } : {}),
        ...(input.spendTokensRate !== undefined ? { spendTokensRate: input.spendTokensRate } : {}),
        ...(input.spendTokensAmount !== undefined ? { spendTokensAmount: input.spendTokensAmount } : {}),
        ...(input.fixedTokensEnabled !== undefined ? { fixedTokensEnabled: input.fixedTokensEnabled } : {}),
        ...(input.fixedTokensPerOrder !== undefined ? { fixedTokensPerOrder: input.fixedTokensPerOrder } : {}),
        ...(input.welcomeBonusEnabled !== undefined ? { welcomeBonusEnabled: input.welcomeBonusEnabled } : {}),
        ...(input.welcomeBonusPoints !== undefined ? { welcomeBonusPoints: input.welcomeBonusPoints } : {}),
        ...(input.minPayoutAmount !== undefined ? { minPayoutAmount: input.minPayoutAmount } : {}),
        ...(input.friendDiscountEnabled !== undefined ? { friendDiscountEnabled: input.friendDiscountEnabled } : {}),
        ...(input.friendDiscountType !== undefined ? { friendDiscountType: input.friendDiscountType } : {}),
        ...(input.friendDiscountValue !== undefined ? { friendDiscountValue: input.friendDiscountValue } : {}),
        ...(input.showTierRoadmap !== undefined ? { showTierRoadmap: input.showTierRoadmap } : {}),
        ...(input.showPerformanceCharts !== undefined ? { showPerformanceCharts: input.showPerformanceCharts } : {}),
        ...(input.showRewardsStore !== undefined ? { showRewardsStore: input.showRewardsStore } : {}),
        ...(input.showRecentPurchases !== undefined ? { showRecentPurchases: input.showRecentPurchases } : {}),
        ...(input.programTitle !== undefined ? { programTitle: input.programTitle } : {}),
        ...(input.customShareMessage !== undefined ? { customShareMessage: input.customShareMessage } : {}),
        ...(input.accentColor !== undefined ? { accentColor: input.accentColor } : {}),
      },
    });

    return {
      ok: true,
      config: {
        id: updated.id,
        organizationId: updated.organizationId,
        isEnabled: updated.isEnabled,
        rewardMode: updated.rewardMode,
        percentageEnabled: updated.percentageEnabled ?? true,
        commissionRate: Number(updated.commissionRate),
        pointsPerCurrency: updated.pointsPerCurrency,
        spendTokensEnabled: updated.spendTokensEnabled ?? false,
        spendTokensRate: updated.spendTokensRate ?? 10,
        spendTokensAmount: Number(updated.spendTokensAmount ?? 100),
        fixedTokensEnabled: updated.fixedTokensEnabled ?? false,
        fixedTokensPerOrder: updated.fixedTokensPerOrder ?? 50,
        welcomeBonusEnabled: updated.welcomeBonusEnabled ?? true,
        welcomeBonusPoints: updated.welcomeBonusPoints,
        minPayoutAmount: Number(updated.minPayoutAmount),
        friendDiscountEnabled: updated.friendDiscountEnabled,
        friendDiscountType: updated.friendDiscountType,
        friendDiscountValue: Number(updated.friendDiscountValue),
        showTierRoadmap: updated.showTierRoadmap,
        showPerformanceCharts: updated.showPerformanceCharts,
        showRewardsStore: updated.showRewardsStore,
        showRecentPurchases: updated.showRecentPurchases,
        programTitle: updated.programTitle,
        customShareMessage: updated.customShareMessage,
        accentColor: updated.accentColor,
        updatedAt: updated.updatedAt,
      },
    };
  });

  // ==========================================
  // CUSTOMER REFERRALS MANAGEMENT ENDPOINTS
  // ==========================================

  // GET /api/v1/store/customer-referrals/overview
  app.get('/store/customer-referrals/overview', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);

    // 1. Fetch config
    let config = await prisma.storeReferralConfig.findUnique({
      where: { organizationId: store.id },
    });
    if (!config) {
      config = await prisma.storeReferralConfig.create({
        data: {
          organizationId: store.id,
          isEnabled: true,
          rewardMode: 'POINTS',
          commissionRate: 10,
          pointsPerCurrency: 1,
          welcomeBonusPoints: 100,
          minPayoutAmount: 500,
          friendDiscountEnabled: true,
          friendDiscountType: 'PERCENTAGE',
          friendDiscountValue: 10,
          showTierRoadmap: true,
          showPerformanceCharts: true,
          showRewardsStore: true,
          showRecentPurchases: true,
          programTitle: 'Customer Advocate & Referral Rewards',
          customShareMessage: 'Get 10% off with my link, and support me!',
          accentColor: '#6c5ce7',
        },
      });
    }

    // 2. Fetch all commissions / referral orders for this store
    const commissions = await prisma.affiliateCommission.findMany({
      where: { organizationId: store.id },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
            creatorCode: true,
            customerProfile: true,
          },
        },
        shopifyOrder: {
          select: {
            id: true,
            name: true,
            email: true,
            total: true,
            currency: true,
            processedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Fetch all advocate links for this store
    const links = await prisma.affiliateLink.findMany({
      where: { organizationId: store.id },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
            creatorCode: true,
            customerProfile: true,
            createdAt: true,
          },
        },
        clicks: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Fetch reward claims for this store
    const claims = await prisma.customerRewardClaim.findMany({
      where: { organizationId: store.id },
      include: {
        user: {
          select: { id: true, displayName: true, email: true, creatorCode: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalSales = commissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount), 0);
    const approvedOrPaid = commissions.filter((c: any) => c.status === 'APPROVED' || c.status === 'PAID');
    const totalPaidRewards = approvedOrPaid.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
    const pendingOrders = commissions.filter((c: any) => c.status === 'PENDING');
    const pendingPayouts = claims.filter((c: any) => c.status === 'PENDING');

    const totalClicks = links.reduce((sum: number, l: any) => sum + (l.clicks?.length || 0), 0);
    const totalOrders = commissions.length;
    const conversionRate = totalClicks > 0 ? ((totalOrders / totalClicks) * 100).toFixed(1) : '0.0';

    // Unique advocates
    const advocateMap = new Map<string, any>();
    for (const link of links) {
      if (link.creator && !advocateMap.has(link.creator.id)) {
        advocateMap.set(link.creator.id, {
          id: link.creator.id,
          name: link.creator.displayName || 'Customer Advocate',
          email: link.creator.email,
          creatorCode: link.creator.creatorCode,
          tier: link.creator.customerProfile?.tier || 'BRONZE',
          pointsBalance: link.creator.customerProfile?.pointsBalance || 0,
          totalEarned: Number(link.creator.customerProfile?.totalEarned || 0),
          clicks: link.clicks?.length || 0,
          orders: 0,
          sales: 0,
          joinedAt: link.creator.createdAt,
          linkSlug: link.slug,
        });
      } else if (link.creator && advocateMap.has(link.creator.id)) {
        const item = advocateMap.get(link.creator.id);
        item.clicks += (link.clicks?.length || 0);
      }
    }

    for (const comm of commissions) {
      if (comm.creator && advocateMap.has(comm.creator.id)) {
        const item = advocateMap.get(comm.creator.id);
        item.orders += 1;
        item.sales += Number(comm.orderAmount);
      } else if (comm.creator) {
        advocateMap.set(comm.creator.id, {
          id: comm.creator.id,
          name: comm.creator.displayName || 'Customer Advocate',
          email: comm.creator.email,
          creatorCode: comm.creator.creatorCode,
          tier: comm.creator.customerProfile?.tier || 'BRONZE',
          pointsBalance: comm.creator.customerProfile?.pointsBalance || 0,
          totalEarned: Number(comm.creator.customerProfile?.totalEarned || 0),
          clicks: 0,
          orders: 1,
          sales: Number(comm.orderAmount),
          joinedAt: comm.createdAt,
          linkSlug: null,
        });
      }
    }

    const advocatesList = Array.from(advocateMap.values());

    return {
      store: { id: store.id, name: store.name, slug: store.slug },
      config,
      metrics: {
        totalAdvocates: advocatesList.length,
        totalSales,
        totalOrders,
        totalClicks,
        conversionRate: Number(conversionRate),
        pendingOrdersCount: pendingOrders.length,
        pendingPayoutsCount: pendingPayouts.length,
        totalPaidRewards,
      },
      topAdvocates: advocatesList.sort((a, b) => b.sales - a.sales).slice(0, 5),
      recentOrders: commissions.slice(0, 6).map((c: any) => ({
        id: c.id,
        orderId: c.shopifyOrder?.id || c.shopifyOrderId,
        orderName: c.shopifyOrder?.name || 'Order',
        customerMasked: c.shopifyOrder?.email ? `${c.shopifyOrder.email.slice(0, 3)}***@${c.shopifyOrder.email.split('@')[1] || 'customer.com'}` : 'Guest Customer',
        advocateName: c.creator?.displayName || 'Advocate',
        advocateCode: c.creator?.creatorCode || 'REF',
        orderAmount: Number(c.orderAmount),
        commissionRate: Number(c.commissionRate),
        rewardAmount: Number(c.amount),
        status: c.status,
        date: c.createdAt,
      })),
    };
  });

  // GET /api/v1/store/customer-referrals/advocates
  app.get('/store/customer-referrals/advocates', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);

    const links = await prisma.affiliateLink.findMany({
      where: { organizationId: store.id },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
            creatorCode: true,
            customerProfile: true,
            createdAt: true,
          },
        },
        clicks: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const commissions = await prisma.affiliateCommission.findMany({
      where: { organizationId: store.id },
      select: { creatorId: true, orderAmount: true, amount: true, status: true },
    });

    const advocateMap = new Map<string, any>();
    for (const link of links) {
      if (link.creator) {
        if (!advocateMap.has(link.creator.id)) {
          advocateMap.set(link.creator.id, {
            id: link.creator.id,
            name: link.creator.displayName || 'Customer Advocate',
            email: link.creator.email,
            creatorCode: link.creator.creatorCode,
            tier: link.creator.customerProfile?.tier || 'BRONZE',
            pointsBalance: link.creator.customerProfile?.pointsBalance || 0,
            totalEarned: Number(link.creator.customerProfile?.totalEarned || 0),
            phone: link.creator.customerProfile?.phone || null,
            clicks: link.clicks?.length || 0,
            orders: 0,
            sales: 0,
            linkSlug: link.slug,
            joinedAt: link.creator.createdAt,
            status: 'ACTIVE',
          });
        } else {
          const adv = advocateMap.get(link.creator.id);
          adv.clicks += (link.clicks?.length || 0);
        }
      }
    }

    for (const comm of commissions) {
      if (comm.creatorId && advocateMap.has(comm.creatorId)) {
        const adv = advocateMap.get(comm.creatorId);
        adv.orders += 1;
        adv.sales += Number(comm.orderAmount);
      }
    }

    return {
      advocates: Array.from(advocateMap.values()),
    };
  });

  // GET /api/v1/store/customer-referrals/orders
  app.get('/store/customer-referrals/orders', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const query = request.query as any;
    const statusFilter = query?.status;

    const whereClause: any = { organizationId: store.id };
    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    const commissions = await prisma.affiliateCommission.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
            creatorCode: true,
            customerProfile: true,
          },
        },
        shopifyOrder: {
          select: {
            id: true,
            name: true,
            email: true,
            total: true,
            currency: true,
            processedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      orders: commissions.map((c: any) => ({
        id: c.id,
        orderId: c.shopifyOrder?.id || c.shopifyOrderId,
        orderName: c.shopifyOrder?.name || 'Order',
        customerMasked: c.shopifyOrder?.email ? `${c.shopifyOrder.email.slice(0, 3)}***@${c.shopifyOrder.email.split('@')[1] || 'customer.com'}` : 'Guest Customer',
        customerEmail: c.shopifyOrder?.email || 'N/A',
        advocateId: c.creator?.id,
        advocateName: c.creator?.displayName || 'Customer Advocate',
        advocateCode: c.creator?.creatorCode || 'REF',
        advocateEmail: c.creator?.email || 'N/A',
        orderAmount: Number(c.orderAmount),
        commissionRate: Number(c.commissionRate),
        rewardAmount: Number(c.amount),
        status: c.status,
        date: c.createdAt,
      })),
    };
  });

  // PATCH /api/v1/store/customer-referrals/orders/:id/status
  app.patch('/store/customer-referrals/orders/:id/status', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: 'APPROVED' | 'REJECTED' | 'PAID' | 'PENDING' };

    const commission = await prisma.affiliateCommission.findFirst({
      where: { id, organizationId: store.id },
      include: { creator: { include: { customerProfile: true } } },
    });

    if (!commission) {
      throw new AppError('ORDER_NOT_FOUND', 'Referral order commission not found.', 404);
    }

    const previousStatus = commission.status;

    const updated = await prisma.affiliateCommission.update({
      where: { id },
      data: { status },
    });

    // If changing from PENDING to APPROVED/PAID, credit advocate points/earnings
    if ((status === 'APPROVED' || status === 'PAID') && previousStatus === 'PENDING' && commission.creatorId) {
      const config = await prisma.storeReferralConfig.findUnique({
        where: { organizationId: store.id },
      });
      const pointsToAdd = Math.round(Number(commission.orderAmount) * (config?.pointsPerCurrency || 1));
      const amountToAdd = Number(commission.amount);

      await prisma.customerProfile.upsert({
        where: { userId: commission.creatorId },
        create: {
          userId: commission.creatorId,
          tier: 'BRONZE',
          pointsBalance: 100 + pointsToAdd,
          totalEarned: amountToAdd,
        },
        update: {
          pointsBalance: { increment: pointsToAdd },
          totalEarned: { increment: amountToAdd },
        },
      });
    }

    return { ok: true, order: updated };
  });

  // GET /api/v1/store/customer-referrals/claims
  app.get('/store/customer-referrals/claims', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);

    const claims = await prisma.customerRewardClaim.findMany({
      where: {
        OR: [
          { organizationId: store.id },
          { organizationId: null },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            creatorCode: true,
            customerProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      claims: claims.map((c: any) => ({
        id: c.id,
        advocateId: c.user?.id,
        advocateName: c.user?.displayName || 'Customer Advocate',
        advocateEmail: c.user?.email || 'N/A',
        advocateCode: c.user?.creatorCode || 'REF',
        rewardTitle: c.rewardTitle,
        rewardType: c.rewardType,
        rewardValue: Number(c.rewardValue),
        pointsCost: c.pointsCost,
        code: c.code,
        status: c.status,
        details: c.details,
        createdAt: c.createdAt,
      })),
    };
  });

  // PATCH /api/v1/store/customer-referrals/claims/:id/status
  app.patch('/store/customer-referrals/claims/:id/status', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: 'COMPLETED' | 'REJECTED' | 'PENDING' };

    const claim = await prisma.customerRewardClaim.findUnique({
      where: { id },
    });

    if (!claim) {
      throw new AppError('CLAIM_NOT_FOUND', 'Reward claim not found.', 404);
    }

    const updated = await prisma.customerRewardClaim.update({
      where: { id },
      data: { status },
    });

    return { ok: true, claim: updated };
  });

  // ==========================================
  // STORE REFERRAL OFFERS CRUD ENDPOINTS
  // ==========================================

  // GET /api/v1/store/customer-referrals/offers
  app.get('/store/customer-referrals/offers', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);

    const offers = await prisma.storeReferralOffer.findMany({
      where: { organizationId: store.id },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });

    // If store has 0 offers yet, auto-create the baseline primary offer from config
    if (offers.length === 0) {
      const config = await prisma.storeReferralConfig.findUnique({
        where: { organizationId: store.id },
      });
      const initialOffer = await prisma.storeReferralOffer.create({
        data: {
          organizationId: store.id,
          title: config?.programTitle || 'Standard Advocate Referral Reward',
          description: 'Give friends a discount at checkout and earn instant rewards on every completed purchase.',
          rewardMode: config?.rewardMode || 'POINTS',
          advocateRewardRate: config?.commissionRate || 10,
          friendDiscountType: config?.friendDiscountType || 'PERCENTAGE',
          friendDiscountValue: config?.friendDiscountValue || 10,
          status: 'ACTIVE',
          isFeatured: true,
          badgeText: 'Active Referral Program',
          bannerText: 'Give 10% OFF, Earn 10% in Rewards!',
        },
      });
      return { offers: [initialOffer] };
    }

    return {
      offers: offers.map((o: any) => ({
        id: o.id,
        organizationId: o.organizationId,
        title: o.title,
        description: o.description,
        rewardMode: o.rewardMode,
        advocateRewardRate: Number(o.advocateRewardRate),
        friendDiscountType: o.friendDiscountType,
        friendDiscountValue: Number(o.friendDiscountValue),
        status: o.status,
        isFeatured: o.isFeatured,
        badgeText: o.badgeText,
        bannerText: o.bannerText,
        startsAt: o.startsAt,
        expiresAt: o.expiresAt,
        usageCount: o.usageCount,
        totalSales: Number(o.totalSales),
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
    };
  });

  // POST /api/v1/store/customer-referrals/offers
  app.post('/store/customer-referrals/offers', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const body = request.body as any;

    if (!body.title || typeof body.title !== 'string') {
      throw new AppError('INVALID_INPUT', 'Offer title is required.', 400);
    }

    const offer = await prisma.storeReferralOffer.create({
      data: {
        organizationId: store.id,
        title: body.title,
        description: body.description || null,
        rewardMode: body.rewardMode || 'POINTS',
        advocateRewardRate: body.advocateRewardRate !== undefined ? Number(body.advocateRewardRate) : 10,
        friendDiscountType: body.friendDiscountType || 'PERCENTAGE',
        friendDiscountValue: body.friendDiscountValue !== undefined ? Number(body.friendDiscountValue) : 10,
        status: body.status || 'ACTIVE',
        isFeatured: Boolean(body.isFeatured),
        badgeText: body.badgeText || null,
        bannerText: body.bannerText || null,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    return { ok: true, offer };
  });

  // PATCH /api/v1/store/customer-referrals/offers/:id
  app.patch('/store/customer-referrals/offers/:id', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const existing = await prisma.storeReferralOffer.findFirst({
      where: { id, organizationId: store.id },
    });

    if (!existing) {
      throw new AppError('OFFER_NOT_FOUND', 'Referral offer not found.', 404);
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.rewardMode !== undefined) updateData.rewardMode = body.rewardMode;
    if (body.advocateRewardRate !== undefined) updateData.advocateRewardRate = Number(body.advocateRewardRate);
    if (body.friendDiscountType !== undefined) updateData.friendDiscountType = body.friendDiscountType;
    if (body.friendDiscountValue !== undefined) updateData.friendDiscountValue = Number(body.friendDiscountValue);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isFeatured !== undefined) updateData.isFeatured = Boolean(body.isFeatured);
    if (body.badgeText !== undefined) updateData.badgeText = body.badgeText;
    if (body.bannerText !== undefined) updateData.bannerText = body.bannerText;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const updated = await prisma.storeReferralOffer.update({
      where: { id },
      data: updateData,
    });

    return { ok: true, offer: updated };
  });

  // DELETE /api/v1/store/customer-referrals/offers/:id
  app.delete('/store/customer-referrals/offers/:id', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const { id } = request.params as { id: string };

    const existing = await prisma.storeReferralOffer.findFirst({
      where: { id, organizationId: store.id },
    });

    if (!existing) {
      throw new AppError('OFFER_NOT_FOUND', 'Referral offer not found.', 404);
    }

    await prisma.storeReferralOffer.delete({
      where: { id },
    });

    return { ok: true, deleted: true };
  });

  // ==========================================
  // STORE REWARDS CATALOG CRUD ENDPOINTS
  // ==========================================

  // GET /api/v1/store/customer-referrals/rewards
  app.get('/store/customer-referrals/rewards', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);

    const rewards = await prisma.storeRewardItem.findMany({
      where: { organizationId: store.id },
      orderBy: [{ pointsCost: 'asc' }, { createdAt: 'desc' }],
    });

    // If 0 rewards exist for this store, seed standard starting reward catalog
    if (rewards.length === 0) {
      const defaultRewards = [
        {
          organizationId: store.id,
          title: '10% Off Store Coupon',
          description: 'Get an exclusive 10% discount promo voucher for your next order.',
          type: 'DISCOUNT_CODE',
          pointsCost: 100,
          rewardValue: 10,
          category: 'VOUCHER',
          badge: 'POPULAR',
          icon: 'Tag',
          status: 'ACTIVE',
        },
        {
          organizationId: store.id,
          title: '₹500 Store Gift Card',
          description: 'Redeem points for ₹500 instant store shopping credit.',
          type: 'GIFT_CARD',
          pointsCost: 500,
          rewardValue: 500,
          category: 'VOUCHER',
          badge: 'HOT',
          icon: 'Gift',
          status: 'ACTIVE',
        },
        {
          organizationId: store.id,
          title: '₹1,000 Store Gift Card',
          description: 'Redeem points for ₹1,000 instant store shopping credit.',
          type: 'GIFT_CARD',
          pointsCost: 1000,
          rewardValue: 1000,
          category: 'VOUCHER',
          badge: 'VIP',
          icon: 'CreditCard',
          status: 'ACTIVE',
        },
        {
          organizationId: store.id,
          title: '₹2,000 Direct Cash Transfer',
          description: 'Transfer cash rewards directly to your UPI ID or Bank Account.',
          type: 'CASH_PAYOUT',
          pointsCost: 2000,
          rewardValue: 2000,
          category: 'CASH',
          badge: 'CASH',
          icon: 'Wallet',
          status: 'ACTIVE',
        },
        {
          organizationId: store.id,
          title: 'Exclusive VIP Mystery Box',
          description: 'Handpicked best-seller products delivered straight to your doorstep.',
          type: 'PRODUCT_GIFT',
          pointsCost: 3500,
          rewardValue: 3500,
          category: 'PERK',
          badge: 'DIAMOND',
          icon: 'Sparkles',
          status: 'ACTIVE',
        },
      ];

      for (const r of defaultRewards) {
        await prisma.storeRewardItem.create({ data: r });
      }

      const createdRewards = await prisma.storeRewardItem.findMany({
        where: { organizationId: store.id },
        orderBy: [{ pointsCost: 'asc' }],
      });

      return {
        rewards: createdRewards.map((r: any) => ({
          id: r.id,
          organizationId: r.organizationId,
          title: r.title,
          description: r.description,
          type: r.type,
          pointsCost: r.pointsCost,
          rewardValue: Number(r.rewardValue),
          category: r.category,
          badge: r.badge,
          icon: r.icon,
          codeTemplate: r.codeTemplate,
          stockQuantity: r.stockQuantity,
          status: r.status,
          minTier: r.minTier,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      };
    }

    return {
      rewards: rewards.map((r: any) => ({
        id: r.id,
        organizationId: r.organizationId,
        title: r.title,
        description: r.description,
        type: r.type,
        pointsCost: r.pointsCost,
        rewardValue: Number(r.rewardValue),
        category: r.category,
        badge: r.badge,
        icon: r.icon,
        codeTemplate: r.codeTemplate,
        stockQuantity: r.stockQuantity,
        status: r.status,
        minTier: r.minTier,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  });

  // POST /api/v1/store/customer-referrals/rewards
  app.post('/store/customer-referrals/rewards', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const body = request.body as any;

    if (!body.title || typeof body.title !== 'string') {
      throw new AppError('INVALID_INPUT', 'Reward title is required.', 400);
    }

    const reward = await prisma.storeRewardItem.create({
      data: {
        organizationId: store.id,
        title: body.title,
        description: body.description || null,
        type: body.type || 'DISCOUNT_CODE',
        pointsCost: body.pointsCost !== undefined ? Number(body.pointsCost) : 500,
        rewardValue: body.rewardValue !== undefined ? Number(body.rewardValue) : 500,
        category: body.category || 'VOUCHER',
        badge: body.badge || null,
        icon: body.icon || 'Gift',
        codeTemplate: body.codeTemplate || null,
        stockQuantity: body.stockQuantity !== undefined && body.stockQuantity !== null ? Number(body.stockQuantity) : null,
        status: body.status || 'ACTIVE',
        minTier: body.minTier || null,
      },
    });

    return { ok: true, reward };
  });

  // PATCH /api/v1/store/customer-referrals/rewards/:id
  app.patch('/store/customer-referrals/rewards/:id', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const existing = await prisma.storeRewardItem.findFirst({
      where: { id, organizationId: store.id },
    });

    if (!existing) {
      throw new AppError('REWARD_NOT_FOUND', 'Reward item not found.', 404);
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.pointsCost !== undefined) updateData.pointsCost = Number(body.pointsCost);
    if (body.rewardValue !== undefined) updateData.rewardValue = Number(body.rewardValue);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.badge !== undefined) updateData.badge = body.badge;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.codeTemplate !== undefined) updateData.codeTemplate = body.codeTemplate;
    if (body.stockQuantity !== undefined) updateData.stockQuantity = body.stockQuantity !== null ? Number(body.stockQuantity) : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.minTier !== undefined) updateData.minTier = body.minTier;

    const updated = await prisma.storeRewardItem.update({
      where: { id },
      data: updateData,
    });

    return { ok: true, reward: updated };
  });

  // DELETE /api/v1/store/customer-referrals/rewards/:id
  app.delete('/store/customer-referrals/rewards/:id', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const { id } = request.params as { id: string };

    const existing = await prisma.storeRewardItem.findFirst({
      where: { id, organizationId: store.id },
    });

    if (!existing) {
      throw new AppError('REWARD_NOT_FOUND', 'Reward item not found.', 404);
    }

    await prisma.storeRewardItem.delete({
      where: { id },
    });

    return { ok: true, deleted: true };
  });

  // ==========================================
  // STORE LEADERBOARD ENDPOINTS
  // ==========================================

  // GET /api/v1/store/customer-referrals/leaderboard
  app.get('/store/customer-referrals/leaderboard', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const query = request.query as any;
    const timeframe = query?.timeframe === 'ALL_TIME' ? 'ALL_TIME' : 'THIS_MONTH';

    const whereClause: any = {
      organizationId: store.id,
      creatorId: { not: null },
      status: { in: ['APPROVED', 'PAID', 'PENDING'] },
    };

    if (timeframe === 'THIS_MONTH') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      whereClause.createdAt = { gte: startOfMonth };
    }

    const commissions = await prisma.affiliateCommission.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
            creatorCode: true,
            customerProfile: true,
          },
        },
      },
    });

    const advocateMap = new Map<string, any>();
    for (const c of commissions) {
      if (!c.creator) continue;
      const cid = c.creator.id;
      if (!advocateMap.has(cid)) {
        advocateMap.set(cid, {
          id: cid,
          name: c.creator.displayName || 'Customer Advocate',
          email: c.creator.email,
          creatorCode: c.creator.creatorCode || 'REF',
          tier: c.creator.customerProfile?.tier || 'BRONZE',
          pointsBalance: c.creator.customerProfile?.pointsBalance || 0,
          totalReferrals: 0,
          totalSales: 0,
          totalEarned: 0,
        });
      }

      const item = advocateMap.get(cid);
      item.totalReferrals += 1;
      item.totalSales += Number(c.orderAmount);
      item.totalEarned += Number(c.amount);
    }

    const sorted = Array.from(advocateMap.values()).sort((a, b) => {
      if (b.totalSales !== a.totalSales) return b.totalSales - a.totalSales;
      return b.totalReferrals - a.totalReferrals;
    });

    const leaderboard = sorted.map((adv, index) => {
      const rank = index + 1;
      let badge = null;
      let prize = null;

      if (rank === 1) {
        badge = '👑 1st Place Champion';
        prize = '+₹2,500 Monthly Bonus Perk';
      } else if (rank === 2) {
        badge = '🥈 2nd Place Runner-up';
        prize = '+₹1,000 Monthly Bonus Perk';
      } else if (rank === 3) {
        badge = '🥉 3rd Place Star';
        prize = '+₹500 Monthly Bonus Perk';
      } else if (rank <= 10) {
        badge = '⭐ Top 10 Elite';
        prize = '+250 Bonus Pts';
      }

      return {
        rank,
        ...adv,
        totalSales: Math.round(adv.totalSales * 100) / 100,
        totalEarned: Math.round(adv.totalEarned * 100) / 100,
        badge,
        prize,
      };
    });

    return {
      timeframe,
      leaderboard,
      podium: leaderboard.slice(0, 3),
      totalParticipants: leaderboard.length,
    };
  });

  // ==========================================
  // STORE MILESTONES CRUD ENDPOINTS
  // ==========================================

  // GET /api/v1/store/customer-referrals/milestones
  app.get('/store/customer-referrals/milestones', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);

    const milestones = await prisma.storeReferralMilestone.findMany({
      where: { organizationId: store.id },
      orderBy: [{ targetType: 'asc' }, { targetValue: 'asc' }],
    });

    if (milestones.length === 0) {
      const defaultMilestones = [
        {
          organizationId: store.id,
          title: 'First Referral Win',
          description: 'Get your very first referred friend purchase on the store.',
          targetType: 'REFERRAL_COUNT',
          targetValue: 1,
          rewardType: 'POINTS',
          pointsBonus: 100,
          rewardValue: 100,
          badgeText: 'STARTER',
          icon: 'Sparkles',
          status: 'ACTIVE',
        },
        {
          organizationId: store.id,
          title: '5 Friends Referred',
          description: 'Successfully refer 5 shopping friends to unlock bonus points.',
          targetType: 'REFERRAL_COUNT',
          targetValue: 5,
          rewardType: 'POINTS',
          pointsBonus: 500,
          rewardValue: 500,
          badgeText: 'BRONZE MILESTONE',
          icon: 'Users',
          status: 'ACTIVE',
        },
        {
          organizationId: store.id,
          title: '15 Referral Super Advocate',
          description: 'Reach 15 completed referral orders and unlock huge reward perks.',
          targetType: 'REFERRAL_COUNT',
          targetValue: 15,
          rewardType: 'GIFT_CARD',
          pointsBonus: 1500,
          rewardValue: 1500,
          badgeText: 'SILVER CHAMPION',
          icon: 'Award',
          status: 'ACTIVE',
        },
        {
          organizationId: store.id,
          title: '30 Referral Legend',
          description: 'Elite milestone: 30 referral orders with VIP status & mystery hamper.',
          targetType: 'REFERRAL_COUNT',
          targetValue: 30,
          rewardType: 'PRODUCT_GIFT',
          pointsBonus: 3500,
          rewardValue: 3500,
          badgeText: 'GOLD LEGEND',
          icon: 'Trophy',
          status: 'ACTIVE',
        },
        {
          organizationId: store.id,
          title: '₹25,000 Sales Volume Milestone',
          description: 'Generate ₹25,000 in attributed shopping volume for partner stores.',
          targetType: 'SALES_AMOUNT',
          targetValue: 25000,
          rewardType: 'CASH_PAYOUT',
          pointsBonus: 2500,
          rewardValue: 2500,
          badgeText: 'HIGH ROLLER',
          icon: 'DollarSign',
          status: 'ACTIVE',
        },
        {
          organizationId: store.id,
          title: '₹1,00,000 Diamond Club',
          description: 'Top-tier milestone: generate ₹1,00,000 in word-of-mouth sales.',
          targetType: 'SALES_AMOUNT',
          targetValue: 100000,
          rewardType: 'CASH_PAYOUT',
          pointsBonus: 10000,
          rewardValue: 10000,
          badgeText: 'DIAMOND CLUB',
          icon: 'Crown',
          status: 'ACTIVE',
        },
      ];

      for (const m of defaultMilestones) {
        await prisma.storeReferralMilestone.create({ data: m });
      }

      const created = await prisma.storeReferralMilestone.findMany({
        where: { organizationId: store.id },
        orderBy: [{ targetType: 'asc' }, { targetValue: 'asc' }],
      });

      return {
        milestones: created.map((m: any) => ({
          id: m.id,
          organizationId: m.organizationId,
          title: m.title,
          description: m.description,
          targetType: m.targetType,
          targetValue: Number(m.targetValue),
          rewardType: m.rewardType,
          pointsBonus: m.pointsBonus,
          rewardValue: Number(m.rewardValue),
          badgeText: m.badgeText,
          icon: m.icon,
          status: m.status,
          createdAt: m.createdAt,
        })),
      };
    }

    return {
      milestones: milestones.map((m: any) => ({
        id: m.id,
        organizationId: m.organizationId,
        title: m.title,
        description: m.description,
        targetType: m.targetType,
        targetValue: Number(m.targetValue),
        rewardType: m.rewardType,
        pointsBonus: m.pointsBonus,
        rewardValue: Number(m.rewardValue),
        badgeText: m.badgeText,
        icon: m.icon,
        status: m.status,
        createdAt: m.createdAt,
      })),
    };
  });

  // POST /api/v1/store/customer-referrals/milestones
  app.post('/store/customer-referrals/milestones', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const body = request.body as any;

    if (!body.title || typeof body.title !== 'string') {
      throw new AppError('INVALID_INPUT', 'Milestone title is required.', 400);
    }

    const milestone = await prisma.storeReferralMilestone.create({
      data: {
        organizationId: store.id,
        title: body.title,
        description: body.description || null,
        targetType: body.targetType || 'REFERRAL_COUNT',
        targetValue: body.targetValue !== undefined ? Number(body.targetValue) : 5,
        rewardType: body.rewardType || 'POINTS',
        pointsBonus: body.pointsBonus !== undefined ? Number(body.pointsBonus) : 250,
        rewardValue: body.rewardValue !== undefined ? Number(body.rewardValue) : 250,
        badgeText: body.badgeText || null,
        icon: body.icon || 'Trophy',
        status: body.status || 'ACTIVE',
      },
    });

    return { ok: true, milestone };
  });

  // PATCH /api/v1/store/customer-referrals/milestones/:id
  app.patch('/store/customer-referrals/milestones/:id', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const existing = await prisma.storeReferralMilestone.findFirst({
      where: { id, organizationId: store.id },
    });

    if (!existing) {
      throw new AppError('MILESTONE_NOT_FOUND', 'Milestone not found.', 404);
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.targetType !== undefined) updateData.targetType = body.targetType;
    if (body.targetValue !== undefined) updateData.targetValue = Number(body.targetValue);
    if (body.rewardType !== undefined) updateData.rewardType = body.rewardType;
    if (body.pointsBonus !== undefined) updateData.pointsBonus = Number(body.pointsBonus);
    if (body.rewardValue !== undefined) updateData.rewardValue = Number(body.rewardValue);
    if (body.badgeText !== undefined) updateData.badgeText = body.badgeText;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.storeReferralMilestone.update({
      where: { id },
      data: updateData,
    });

    return { ok: true, milestone: updated };
  });

  // DELETE /api/v1/store/customer-referrals/milestones/:id
  app.delete('/store/customer-referrals/milestones/:id', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const store = await storeFor(app, actor.userId);
    const { id } = request.params as { id: string };

    const existing = await prisma.storeReferralMilestone.findFirst({
      where: { id, organizationId: store.id },
    });

    if (!existing) {
      throw new AppError('MILESTONE_NOT_FOUND', 'Milestone not found.', 404);
    }

    await prisma.storeReferralMilestone.delete({
      where: { id },
    });

    return { ok: true, deleted: true };
  });
};
