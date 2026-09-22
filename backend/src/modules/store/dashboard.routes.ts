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

    // 1. Fetch Orders for Current Month & Previous Month
    const [
      currentMonthOrders,
      previousMonthOrders,
      last30DaysOrders,
      recentOrders,
      activeCreatorsCount,
      newCreatorsThisMonthCount,
      currentMonthCommissions,
      previousMonthCommissions,
      last30DaysCommissions,
      topCommissionsByCreator,
      totalProductsCount,
    ] = await Promise.all([
      // Current month orders
      prisma.shopifyOrder.findMany({
        where: {
          organizationId: organization.id,
          processedAt: { gte: monthStart },
        },
        select: { total: true, financialStatus: true, processedAt: true, creatorCode: true },
      }),
      // Previous month orders
      prisma.shopifyOrder.findMany({
        where: {
          organizationId: organization.id,
          processedAt: { gte: previousMonthStart, lt: monthStart },
        },
        select: { total: true },
      }),
      // Last 30 days orders (for trend chart)
      prisma.shopifyOrder.findMany({
        where: {
          organizationId: organization.id,
          processedAt: { gte: thirtyDaysAgo },
        },
        select: { total: true, processedAt: true, creatorCode: true },
      }),
      // Recent 5 orders
      prisma.shopifyOrder.findMany({
        where: { organizationId: organization.id },
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
      // Last 30 days commissions
      prisma.affiliateCommission.findMany({
        where: {
          organizationId: organization.id,
          createdAt: { gte: thirtyDaysAgo },
          status: { not: 'REVERSED' },
        },
        select: { amount: true, orderAmount: true, createdAt: true },
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

    const currentTotalSales = sumTotal(currentMonthOrders);
    const previousTotalSales = sumTotal(previousMonthOrders);
    const currentTotalOrders = currentMonthOrders.length;
    const previousTotalOrders = previousMonthOrders.length;

    const currentCreatorSales = sumAmount(currentMonthCommissions);
    const previousCreatorSales = sumAmount(previousMonthCommissions);

    const calcPercentChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    // Build 30-day performance map
    const dailyMap = new Map<string, { date: string; day: string; sales: number; orders: number; creatorSales: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(thirtyDaysAgo.getDate() + i);
      const isoDate = d.toISOString().slice(0, 10);
      const dayLabel = String(d.getDate()).padStart(2, '0');
      dailyMap.set(isoDate, { date: isoDate, day: dayLabel, sales: 0, orders: 0, creatorSales: 0 });
    }

    for (const order of last30DaysOrders) {
      if (order.processedAt) {
        const iso = order.processedAt.toISOString().slice(0, 10);
        const existing = dailyMap.get(iso);
        if (existing) {
          existing.sales += Number(order.total || 0);
          existing.orders += 1;
        }
      }
    }

    for (const comm of last30DaysCommissions) {
      if (comm.createdAt) {
        const iso = comm.createdAt.toISOString().slice(0, 10);
        const existing = dailyMap.get(iso);
        if (existing) {
          existing.creatorSales += Number(comm.orderAmount || 0);
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

    // Channel breakdown
    const directSales = Math.max(0, currentTotalSales - currentCreatorSales);
    const directPercentage = currentTotalSales > 0 ? Math.round((directSales / currentTotalSales) * 100) : 100;
    const creatorPercentage = currentTotalSales > 0 ? Math.round((currentCreatorSales / currentTotalSales) * 100) : 0;

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
          value: currentTotalSales,
          change: calcPercentChange(currentTotalSales, previousTotalSales),
        },
        totalOrders: {
          value: currentTotalOrders,
          change: calcPercentChange(currentTotalOrders, previousTotalOrders),
        },
        creatorSales: {
          value: currentCreatorSales,
          change: calcPercentChange(currentCreatorSales, previousCreatorSales),
        },
        activeCreators: {
          value: activeCreatorsCount,
          change: newCreatorsThisMonthCount,
        },
      },
      channelBreakdown: {
        totalSales: currentTotalSales,
        directSales,
        directPercentage,
        creatorSales: currentCreatorSales,
        creatorPercentage,
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
