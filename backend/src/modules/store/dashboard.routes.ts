import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const storeDashboardRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/store/dashboard', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);

    const organization = await prisma.organization.findFirst({
      where: { ownerId: actor.userId },
      select: {
        id: true,
        name: true,
        shopDomain: true,
        connectionStatus: true,
        platform: true,
        owner: { select: { displayName: true, email: true } },
      },
    });

    if (!organization) {
      throw new AppError('STORE_NOT_FOUND', 'Organization not found.', 404);
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));

    // 1. Fetch only orders attributed through MegaInfluencer. Shopify still
    // stores every synced order, but direct-store data does not appear in this
    // creator-commerce dashboard.
    const [
      currentMonthOrders,
      previousMonthOrders,
      last30DaysOrders,
      recentOrders,
      activeCreatorsCount,
      newCreatorsThisMonthCount,
      currentMonthCommissions,
      previousMonthCommissions,
      topCommissionsByCreator,
      totalProductsCount,
    ] = await Promise.all([
      // Current month orders
      prisma.shopifyOrder.findMany({
        where: {
          organizationId: organization.id,
          processedAt: { gte: monthStart },
          creatorCode: { not: null },
        },
        select: { total: true, financialStatus: true, processedAt: true, creatorCode: true },
      }),
      // Previous month orders
      prisma.shopifyOrder.findMany({
        where: {
          organizationId: organization.id,
          processedAt: { gte: previousMonthStart, lt: monthStart },
          creatorCode: { not: null },
        },
        select: { total: true },
      }),
      // Last 30 days orders (for trend chart)
      prisma.shopifyOrder.findMany({
        where: {
          organizationId: organization.id,
          processedAt: { gte: thirtyDaysAgo },
          creatorCode: { not: null },
        },
        select: { total: true, processedAt: true, creatorCode: true },
      }),
      // Recent 5 orders
      prisma.shopifyOrder.findMany({
        where: { organizationId: organization.id, creatorCode: { not: null } },
        orderBy: { processedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          currency: true,
          total: true,
          financialStatus: true,
          fulfillmentStatus: true,
          processedAt: true,
          creatorCode: true,
        },
      }),
      // Active creators count for this store (links or assignments)
      prisma.affiliateLink.count({
        where: { organizationId: organization.id, status: 'ACTIVE' },
      }),
      // New creators this month
      prisma.affiliateLink.count({
        where: {
          organizationId: organization.id,
          status: 'ACTIVE',
          createdAt: { gte: monthStart },
        },
      }),
      // Current month commissions
      prisma.affiliateCommission.findMany({
        where: {
          organizationId: organization.id,
          createdAt: { gte: monthStart },
          status: { not: 'REVERSED' },
        },
        select: { amount: true, orderAmount: true },
      }),
      // Previous month commissions
      prisma.affiliateCommission.findMany({
        where: {
          organizationId: organization.id,
          createdAt: { gte: previousMonthStart, lt: monthStart },
          status: { not: 'REVERSED' },
        },
        select: { amount: true, orderAmount: true },
      }),
      // Top performing creators
      prisma.affiliateCommission.groupBy({
        by: ['creatorId'],
        where: {
          organizationId: organization.id,
          status: { not: 'REVERSED' },
          createdAt: { gte: monthStart },
          creatorId: { not: null },
        },
        _sum: { amount: true, orderAmount: true },
        _count: { id: true },
        orderBy: { _sum: { orderAmount: 'desc' } },
        take: 5,
      }),
      // Total products
      prisma.shopifyProduct.count({
        where: { organizationId: organization.id },
      }),
    ]);

    // Calculate totals & changes
    const sumTotal = (items: Array<{ total: string | null }>) =>
      items.reduce((acc, item) => acc + Number(item.total || 0), 0);
    const sumAmount = (items: Array<{ orderAmount: unknown }>) =>
      items.reduce((acc, item) => acc + Number(item.orderAmount || 0), 0);
    const sumComms = (items: Array<{ amount: unknown }>) =>
      items.reduce((acc, item) => acc + Number(item.amount || 0), 0);

    const currentTotalSales = sumTotal(currentMonthOrders);
    const previousTotalSales = sumTotal(previousMonthOrders);
    const currentTotalOrders = currentMonthOrders.length;
    const previousTotalOrders = previousMonthOrders.length;

    const currentCreatorSales = currentTotalSales;
    const previousCreatorSales = previousTotalSales;
    const currentCreatorOrders = currentTotalOrders;
    const previousCreatorOrders = previousTotalOrders;
    const currentCommissionsAmount = sumComms(currentMonthCommissions);
    const previousCommissionsAmount = sumComms(previousMonthCommissions);

    const calcPercentChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    // Build a 30-day timeline from platform-attributed Shopify orders only.
    const dailyMap = new Map<string, { date: string; day: string; sales: number; orders: number; creatorSales: number; creatorOrders: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(thirtyDaysAgo.getDate() + i);
      const isoDate = d.toISOString().slice(0, 10);
      const dayLabel = String(d.getDate()).padStart(2, '0');
      dailyMap.set(isoDate, { date: isoDate, day: dayLabel, sales: 0, orders: 0, creatorSales: 0, creatorOrders: 0 });
    }

    for (const order of last30DaysOrders) {
      if (order.processedAt) {
        const iso = order.processedAt.toISOString().slice(0, 10);
        const existing = dailyMap.get(iso);
        if (existing) {
          const amount = Number(order.total || 0);
          existing.sales += amount;
          existing.orders += 1;
          existing.creatorSales += amount;
          existing.creatorOrders += 1;
        }
      }
    }

    // Resolve creator details for top performers
    const creatorIds = topCommissionsByCreator.map((c: any) => c.creatorId).filter(Boolean);
    const creatorUsers = await prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, displayName: true, creatorCode: true, email: true },
    });

    const creatorUserMap = new Map(creatorUsers.map((u: any) => [u.id, u]));

    const tones = ['bg-coral/15 text-coral', 'bg-primary/15 text-primary', 'bg-teal/15 text-teal', 'bg-indigo/15 text-indigo', 'bg-warning/15 text-warning'];

    const topCreators = topCommissionsByCreator.map((item: any, idx: number) => {
      const user: any = creatorUserMap.get(item.creatorId);
      const name = user?.displayName || 'Creator';
      const initials = name
        .split(' ')
        .map((p: string) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      return {
        id: item.creatorId,
        name,
        handle: user?.creatorCode ? `@${user.creatorCode}` : user?.email?.split('@')[0] || '@creator',
        initials,
        orders: item._count.id,
        sales: Number(item._sum.orderAmount || 0),
        commission: Number(item._sum.amount || 0),
        color: tones[idx % tones.length],
      };
    });

    return {
      store: {
        name: organization.name,
        ownerName: organization.owner?.displayName || 'Merchant',
        shopDomain: organization.shopDomain,
        connectionStatus: organization.connectionStatus,
        totalProducts: totalProductsCount,
      },
      metrics: {
        totalSales: {
          value: currentCreatorSales, // Creator Attributed GMV generated through our platform
          change: calcPercentChange(currentCreatorSales, previousCreatorSales),
        },
        totalOrders: {
          value: currentCreatorOrders, // Creator Attributed Orders generated through our platform
          change: calcPercentChange(currentCreatorOrders, previousCreatorOrders),
        },
        creatorSales: {
          value: currentCreatorSales,
          change: calcPercentChange(currentCreatorSales, previousCreatorSales),
        },
        commissions: {
          value: currentCommissionsAmount,
          change: calcPercentChange(currentCommissionsAmount, previousCommissionsAmount),
        },
        activeCreators: {
          value: activeCreatorsCount,
          change: newCreatorsThisMonthCount,
        },
      },
      channelBreakdown: {
        totalSales: currentTotalSales,
        creatorSales: currentTotalSales,
        creatorPercentage: currentTotalSales > 0 ? 100 : 0,
      },
      performance: Array.from(dailyMap.values()),
      recentOrders: recentOrders.map((order: any) => ({
        id: order.id,
        name: order.name,
        customer: order.email?.split('@')[0] || 'Guest',
        email: order.email,
        total: Number(order.total || 0),
        currency: order.currency || 'INR',
        financialStatus: order.financialStatus || 'Paid',
        fulfillmentStatus: order.fulfillmentStatus || 'Unfulfilled',
        processedAt: order.processedAt,
        creatorCode: order.creatorCode,
      })),
      topCreators,
    };
  });
};
