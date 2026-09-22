import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';

export const adminOverviewRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  // GET /admin/dashboard - Comprehensive platform overview
  app.get('/admin/dashboard', async (req) => {
    requireRole(req, ['ADMIN']);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      influencersCount,
      activeInfluencersCount,
      storesCount,
      activeStoresCount,
      allOrders,
      pendingApplicationsCount,
      pendingStoresCount,
      recentOrders,
      recentCampaigns,
      recentStores,
      recentInfluencers,
      allCommissions,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'INFLUENCER' } }),
      prisma.user.count({ where: { role: 'INFLUENCER', status: 'ACTIVE' } }),
      prisma.organization.count(),
      prisma.organization.count({ where: { status: 'ACTIVE' } }),
      prisma.shopifyOrder.findMany({
        select: { total: true, processedAt: true, createdAt: true },
      }),
      prisma.campaignApplication.count({ where: { status: 'PENDING' } }),
      prisma.organization.count({ where: { connectionStatus: 'PENDING' } }),
      prisma.shopifyOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { organization: { select: { name: true } } },
      }),
      prisma.campaign.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { organization: { select: { name: true } } },
      }),
      prisma.organization.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true, connectionStatus: true },
      }),
      prisma.user.findMany({
        where: { role: 'INFLUENCER' },
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: { id: true, displayName: true, email: true, createdAt: true, status: true },
      }),
      prisma.affiliateCommission.findMany({
        where: { status: { not: 'REVERSED' } },
        select: { amount: true, orderAmount: true, status: true },
      }),
    ]);

    const totalGMV = allOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const totalCommissionsAccrued = allCommissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const pendingReviewsCount = pendingApplicationsCount + pendingStoresCount;

    // 12-month performance timeline
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = now.getMonth();
    const monthlyPerformance: { month: string; value: number; orders: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), currentMonthIdx - i, 1);
      const nextD = new Date(now.getFullYear(), currentMonthIdx - i + 1, 1);
      const label = months[d.getMonth()];

      const monthOrders = allOrders.filter((o: any) => {
        const orderDate = o.processedAt ? new Date(o.processedAt) : new Date(o.createdAt);
        return orderDate >= d && orderDate < nextD;
      });

      const monthGMV = monthOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
      monthlyPerformance.push({
        month: label,
        value: monthGMV,
        orders: monthOrders.length,
      });
    }

    // Build unified recent activity feed
    const activities: { title: string; detail: string; time: string; tone: string }[] = [];

    for (const o of recentOrders) {
      activities.push({
        title: `New order ${o.name}`,
        detail: `${o.organization?.name ?? 'Store'} · ₹${Number(o.total || 0).toLocaleString('en-IN')}`,
        time: formatRelativeTime(o.createdAt),
        tone: 'bg-emerald-500',
      });
    }
    for (const c of recentCampaigns) {
      activities.push({
        title: `Campaign created: ${c.title}`,
        detail: `${c.organization?.name ?? 'Store'} · ${c.category}`,
        time: formatRelativeTime(c.createdAt),
        tone: 'bg-primary',
      });
    }
    for (const s of recentStores) {
      activities.push({
        title: `Store joined: ${s.name}`,
        detail: `Status: ${s.connectionStatus}`,
        time: formatRelativeTime(s.createdAt),
        tone: 'bg-blue-500',
      });
    }

    // Review Queue items
    const reviewQueue = [
      ...recentInfluencers.map((inf: any) => ({
        name: inf.displayName,
        type: 'Influencer onboarding',
        requested: formatRelativeTime(inf.createdAt),
        status: inf.status === 'ACTIVE' ? 'Active' : 'Pending Review',
        id: inf.id,
      })),
      ...recentStores.map((st: any) => ({
        name: st.name,
        type: 'Store onboarding',
        requested: formatRelativeTime(st.createdAt),
        status: st.connectionStatus === 'CONNECTED' ? 'Active' : 'Pending Verification',
        id: st.id,
      })),
    ];

    return {
      metrics: {
        activeInfluencers: activeInfluencersCount,
        totalInfluencers: influencersCount,
        activeStores: activeStoresCount,
        totalStores: storesCount,
        platformGMV: totalGMV,
        totalOrdersCount: allOrders.length,
        totalCommissions: totalCommissionsAccrued,
        pendingReviews: pendingReviewsCount,
      },
      monthlyPerformance,
      activities: activities.slice(0, 8),
      reviewQueue: reviewQueue.slice(0, 6),
    };
  });

  // GET /admin/orders - All platform orders
  app.get('/admin/orders', async (req) => {
    requireRole(req, ['ADMIN']);
    const query = req.query as { search?: string; status?: string };

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { creatorCode: { contains: query.search, mode: 'insensitive' } },
        { organization: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.status && query.status !== 'ALL') {
      where.financialStatus = { equals: query.status, mode: 'insensitive' };
    }

    const [rows, total] = await Promise.all([
      prisma.shopifyOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          organization: { select: { id: true, name: true, slug: true } },
          affiliateCommissions: {
            select: {
              amount: true,
              commissionRate: true,
              status: true,
              creator: { select: { displayName: true, creatorCode: true } },
            },
          },
        },
      }),
      prisma.shopifyOrder.count({ where }),
    ]);

    const totalGMV = rows.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

    return {
      orders: rows.map((o: any) => {
        const comm = o.affiliateCommissions?.[0] ?? null;
        return {
          id: o.id,
          name: o.name,
          storeName: o.organization?.name ?? 'Store',
          storeId: o.organization?.id,
          customerEmail: o.email ?? 'Customer',
          total: Number(o.total || 0),
          currency: o.currency ?? 'INR',
          financialStatus: o.financialStatus ?? 'PAID',
          fulfillmentStatus: o.fulfillmentStatus ?? 'UNFULFILLED',
          processedAt: o.processedAt ?? o.createdAt,
          creatorCode: o.creatorCode ?? comm?.creator?.creatorCode ?? null,
          creatorName: comm?.creator?.displayName ?? null,
          commissionAmount: comm ? Number(comm.amount) : 0,
          commissionStatus: comm?.status ?? null,
        };
      }),
      total,
      totalGMV,
    };
  });

  // GET /admin/commissions - All platform commissions & payouts
  app.get('/admin/commissions', async (req) => {
    requireRole(req, ['ADMIN']);
    const query = req.query as { status?: string; search?: string };

    const where: any = {};
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { creator: { displayName: { contains: query.search, mode: 'insensitive' } } },
        { creator: { creatorCode: { contains: query.search, mode: 'insensitive' } } },
        { organization: { name: { contains: query.search, mode: 'insensitive' } } },
        { shopifyOrder: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [rows, allCommissions] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
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
          organization: { select: { id: true, name: true, slug: true } },
          shopifyOrder: { select: { id: true, name: true, total: true, financialStatus: true } },
        },
      }),
      prisma.affiliateCommission.findMany({
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
        storeName: r.organization?.name ?? 'Store',
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
        totalCommissionsCount: allCommissions.length,
      },
    };
  });

  // GET /admin/products - All platform products catalog
  app.get('/admin/products', async (req) => {
    requireRole(req, ['ADMIN']);
    const query = req.query as { search?: string };

    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { vendor: { contains: query.search, mode: 'insensitive' } },
        { organization: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const rows = await prisma.shopifyProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { productAssignments: true, affiliateLinks: true } },
      },
    });

    const totalProducts = await prisma.shopifyProduct.count();

    return {
      products: rows.map((p: any) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        storeName: p.organization?.name ?? 'Store',
        storeId: p.organization?.id,
        price: Number(p.price || 0),
        currency: p.currency ?? 'INR',
        imageUrl: p.imageUrl,
        vendor: p.vendor,
        inventoryTotal: p.inventoryTotal,
        assignedCreatorsCount: p._count?.productAssignments ?? 0,
        activeLinksCount: p._count?.affiliateLinks ?? 0,
        syncedAt: p.syncedAt,
      })),
      totalProducts,
    };
  });

  // GET /admin/campaigns - All platform campaigns
  app.get('/admin/campaigns', async (req) => {
    requireRole(req, ['ADMIN']);
    const query = req.query as { search?: string; status?: string };

    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
        { organization: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    const rows = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { applications: true, assignments: true } },
      },
    });

    return {
      campaigns: rows.map((c: any) => ({
        id: c.id,
        title: c.title,
        brief: c.brief,
        category: c.category,
        imageUrl: c.imageUrl,
        campaignType: c.campaignType,
        status: c.status,
        storeName: c.organization?.name ?? 'Brand',
        storeId: c.organization?.id,
        budgetMin: c.budgetMin,
        budgetMax: c.budgetMax,
        compensationType: c.compensationType,
        deliverables: c.deliverables,
        applicationDeadline: c.applicationDeadline,
        applicationsCount: c._count?.applications ?? 0,
        assignedCreatorsCount: c._count?.assignments ?? 0,
        createdAt: c.createdAt,
      })),
      totalCampaigns: rows.length,
      liveCount: rows.filter((c: any) => c.status === 'PUBLISHED').length,
    };
  });

  // GET /admin/users - Platform users roster
  app.get('/admin/users', async (req) => {
    requireRole(req, ['ADMIN']);
    const query = req.query as { role?: string; search?: string };

    const where: any = {};
    if (query.role && query.role !== 'ALL') {
      where.role = query.role;
    }
    if (query.search) {
      where.OR = [
        { displayName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { creatorCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const rows = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        status: true,
        creatorCode: true,
        createdAt: true,
        instagramConnection: { select: { username: true, status: true } },
        organizations: { select: { id: true, name: true } },
      },
    });

    const [totalUsers, totalAdmins, totalStores, totalInfluencers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'STORE_OWNER' } }),
      prisma.user.count({ where: { role: 'INFLUENCER' } }),
    ]);

    return {
      users: rows.map((u: any) => ({
        id: u.id,
        name: u.displayName,
        email: u.email,
        role: u.role,
        status: u.status,
        creatorCode: u.creatorCode,
        instagramUsername: u.instagramConnection?.username ?? null,
        storeName: u.organizations?.[0]?.name ?? null,
        createdAt: u.createdAt,
      })),
      metrics: {
        totalUsers,
        totalAdmins,
        totalStores,
        totalInfluencers,
      },
    };
  });

  // GET /admin/social - Instagram connections health
  app.get('/admin/social', async (req) => {
    requireRole(req, ['ADMIN']);

    const rows = await prisma.instagramConnection.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, displayName: true, email: true, creatorCode: true } },
      },
    });

    const totalAccounts = rows.length;
    const healthyCount = rows.filter((r: any) => r.status === 'ACTIVE').length;
    const attentionNeededCount = totalAccounts - healthyCount;

    return {
      accounts: rows.map((r: any) => ({
        id: r.id,
        influencerId: r.userId,
        influencerName: r.user?.displayName ?? 'Influencer',
        influencerEmail: r.user?.email ?? null,
        creatorCode: r.user?.creatorCode ?? null,
        username: r.username,
        status: r.status,
        tokenExpiresAt: r.tokenExpiresAt,
        syncedAt: r.updatedAt,
      })),
      metrics: {
        totalAccounts,
        healthyCount,
        attentionNeededCount,
      },
    };
  });

  // GET /admin/analytics - High level platform attribution & revenue metrics
  app.get('/admin/analytics', async (req) => {
    requireRole(req, ['ADMIN']);

    const [orders, commissions, clicksCount] = await Promise.all([
      prisma.shopifyOrder.findMany({
        select: { total: true, creatorCode: true, createdAt: true },
      }),
      prisma.affiliateCommission.findMany({
        where: { status: { not: 'REVERSED' } },
        select: { orderAmount: true, amount: true, createdAt: true },
      }),
      prisma.affiliateLinkClick.count(),
    ]);

    const totalPlatformGMV = orders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const creatorAttributedGMV = commissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount || 0), 0);
    const totalCommissionsPaid = commissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const totalOrdersCount = orders.length;
    const attributedOrdersCount = commissions.length;

    const conversionRate = clicksCount > 0 ? (attributedOrdersCount / clicksCount) * 100 : 0;

    return {
      overview: {
        totalPlatformGMV,
        creatorAttributedGMV,
        totalCommissionsPaid,
        totalOrdersCount,
        attributedOrdersCount,
        totalClicksCount: clicksCount,
        conversionRate: Number(conversionRate.toFixed(2)),
      },
      placements: [
        { channel: 'Instagram Bio Link / Link-in-bio', share: 44, gmv: Math.round(creatorAttributedGMV * 0.44) },
        { channel: 'Instagram Story Stickers & Swipes', share: 32, gmv: Math.round(creatorAttributedGMV * 0.32) },
        { channel: 'Instagram Direct Messages / Automation', share: 16, gmv: Math.round(creatorAttributedGMV * 0.16) },
        { channel: 'Creator Promo Codes at Checkout', share: 8, gmv: Math.round(creatorAttributedGMV * 0.08) },
      ],
    };
  });
};

function formatRelativeTime(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
