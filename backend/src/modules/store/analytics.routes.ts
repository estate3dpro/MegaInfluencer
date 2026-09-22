import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const storeAnalyticsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/store/analytics', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const query = request.query as { range?: '7d' | '30d' | '90d' };
    const days = query.range === '7d' ? 7 : query.range === '90d' ? 90 : 30;

    const organization = await prisma.organization.findFirst({
      where: { ownerId: actor.userId },
      select: { id: true, name: true, shopDomain: true },
    });

    if (!organization) {
      throw new AppError('STORE_NOT_FOUND', 'Organization not found.', 404);
    }

    const now = new Date();
    const startDate = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
    const prevStartDate = startOfDay(new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000));

    const activeCommissionWhere = {
      organizationId: organization.id,
      status: { not: 'REVERSED' as const },
    };

    // 1. Fetch live metrics from DB
    const [
      currentClicks,
      previousClicks,
      currentCommissions,
      previousCommissions,
      allClicksInRange,
      affiliateLinks,
      creatorsWithUsers,
      totalOrdersInRange,
    ] = await Promise.all([
      prisma.affiliateLinkClick.count({
        where: { organizationId: organization.id, createdAt: { gte: startDate } },
      }),
      prisma.affiliateLinkClick.count({
        where: { organizationId: organization.id, createdAt: { gte: prevStartDate, lt: startDate } },
      }),
      prisma.affiliateCommission.findMany({
        where: { ...activeCommissionWhere, createdAt: { gte: startDate } },
        select: {
          id: true,
          amount: true,
          orderAmount: true,
          creatorId: true,
          linkId: true,
          createdAt: true,
          shopifyOrder: { select: { id: true, name: true, total: true } },
        },
      }),
      prisma.affiliateCommission.findMany({
        where: { ...activeCommissionWhere, createdAt: { gte: prevStartDate, lt: startDate } },
        select: { amount: true, orderAmount: true, creatorId: true },
      }),
      prisma.affiliateLinkClick.findMany({
        where: { organizationId: organization.id, createdAt: { gte: startDate } },
        select: {
          id: true,
          linkId: true,
          utmMedium: true,
          utmSource: true,
          createdAt: true,
          link: { select: { creatorId: true, slug: true } },
        },
      }),
      prisma.affiliateLink.findMany({
        where: { organizationId: organization.id },
        select: {
          id: true,
          slug: true,
          creatorId: true,
          productId: true,
          commissionRate: true,
          product: { select: { id: true, title: true, imageUrl: true, price: true } },
        },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { affiliateLinks: { some: { organizationId: organization.id } } },
            { affiliateCommissions: { some: { organizationId: organization.id } } },
            { storeAssignments: { some: { organizationId: organization.id } } },
          ],
        },
        select: {
          id: true,
          displayName: true,
          creatorCode: true,
          email: true,
          instagramConnection: {
            select: { username: true, status: true },
          },
        },
      }),
      prisma.shopifyOrder.count({
        where: { organizationId: organization.id, processedAt: { gte: startDate } },
      }),
    ]);

    const sumTotal = (items: Array<{ orderAmount: unknown }>) =>
      items.reduce((acc, item) => acc + Number(item.orderAmount || 0), 0);
    const sumCommission = (items: Array<{ amount: unknown }>) =>
      items.reduce((acc, item) => acc + Number(item.amount || 0), 0);

    const totalCreatorSales = sumTotal(currentCommissions);
    const prevCreatorSales = sumTotal(previousCommissions);
    const totalCommissionsEarned = sumCommission(currentCommissions);
    const totalCreatorOrders = currentCommissions.length;
    const prevCreatorOrders = previousCommissions.length;

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const overallConversionRate =
      currentClicks > 0 ? Number(((totalCreatorOrders / currentClicks) * 100).toFixed(2)) : 0;
    const avgOrderValue =
      totalCreatorOrders > 0 ? Math.round(totalCreatorSales / totalCreatorOrders) : 0;

    // 2. Timeline Aggregation (Day by Day)
    const timelineMap = new Map<string, { date: string; day: string; clicks: number; orders: number; sales: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const dayStr = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
      timelineMap.set(iso, { date: iso, day: dayStr, clicks: 0, orders: 0, sales: 0 });
    }

    for (const click of allClicksInRange) {
      if (click.createdAt) {
        const iso = click.createdAt.toISOString().slice(0, 10);
        const item = timelineMap.get(iso);
        if (item) item.clicks += 1;
      }
    }

    for (const comm of currentCommissions) {
      if (comm.createdAt) {
        const iso = comm.createdAt.toISOString().slice(0, 10);
        const item = timelineMap.get(iso);
        if (item) {
          item.orders += 1;
          item.sales += Number(comm.orderAmount || 0);
        }
      }
    }

    // 3. Instagram Placements Breakdown (DMs, Stories, Bio, etc.)
    const placementCounts: Record<string, number> = {
      dm_automation: 0,
      story_link: 0,
      bio_link: 0,
      other: 0,
    };

    for (const click of allClicksInRange) {
      const med = String(click.utmMedium || '').toLowerCase();
      if (med.includes('dm') || med.includes('auto') || med.includes('message')) {
        placementCounts.dm_automation += 1;
      } else if (med.includes('story')) {
        placementCounts.story_link += 1;
      } else if (med.includes('bio')) {
        placementCounts.bio_link += 1;
      } else {
        placementCounts.other += 1;
      }
    }

    const totalPlacements = currentClicks || 1;
    const placements = [
      {
        name: 'Instagram DM Automations',
        clicks: placementCounts.dm_automation,
        share: Math.round((placementCounts.dm_automation / totalPlacements) * 100),
        color: 'bg-primary',
      },
      {
        name: 'Instagram Story Stickers',
        clicks: placementCounts.story_link,
        share: Math.round((placementCounts.story_link / totalPlacements) * 100),
        color: 'bg-coral',
      },
      {
        name: 'Bio & Link-in-Bio',
        clicks: placementCounts.bio_link,
        share: Math.round((placementCounts.bio_link / totalPlacements) * 100),
        color: 'bg-teal',
      },
      {
        name: 'Direct & Other Sources',
        clicks: placementCounts.other,
        share: Math.round((placementCounts.other / totalPlacements) * 100),
        color: 'bg-indigo',
      },
    ];

    // 4. Creator Leaderboard Calculation
    // Map clicks per creator
    const creatorClicksMap = new Map<string, number>();
    for (const click of allClicksInRange) {
      const cId = click.link?.creatorId;
      if (cId) {
        creatorClicksMap.set(cId, (creatorClicksMap.get(cId) ?? 0) + 1);
      }
    }

    // Map commissions and sales per creator
    const creatorCommissionsMap = new Map<string, { orders: number; sales: number; commission: number }>();
    for (const comm of currentCommissions) {
      if (comm.creatorId) {
        const existing = creatorCommissionsMap.get(comm.creatorId) || { orders: 0, sales: 0, commission: 0 };
        existing.orders += 1;
        existing.sales += Number(comm.orderAmount || 0);
        existing.commission += Number(comm.amount || 0);
        creatorCommissionsMap.set(comm.creatorId, existing);
      }
    }

    const tones = ['bg-coral/15 text-coral', 'bg-primary/15 text-primary', 'bg-teal/15 text-teal', 'bg-indigo/15 text-indigo', 'bg-warning/15 text-warning'];

    const leaderboard = creatorsWithUsers
      .map((creator: any, idx: number) => {
        const commData = creatorCommissionsMap.get(creator.id) || { orders: 0, sales: 0, commission: 0 };
        const clicks = creatorClicksMap.get(creator.id) || 0;
        const conversionRate = clicks > 0 ? Number(((commData.orders / clicks) * 100).toFixed(1)) : 0;

        let tier = 'Bronze';
        let tierColor = 'text-amber-700 bg-amber-500/10 border-amber-500/20';
        if (commData.sales >= 100000) {
          tier = 'Diamond';
          tierColor = 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20';
        } else if (commData.sales >= 50000) {
          tier = 'Gold';
          tierColor = 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
        } else if (commData.sales >= 20000) {
          tier = 'Silver';
          tierColor = 'text-slate-600 bg-slate-500/10 border-slate-500/20';
        }

        const igHandle = creator.instagramConnection?.username
          ? `@${creator.instagramConnection.username}`
          : creator.creatorCode
          ? `@${creator.creatorCode}`
          : `@${creator.email?.split('@')[0] || 'creator'}`;

        const initials = creator.displayName
          .split(' ')
          .map((p: string) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return {
          id: creator.id,
          name: creator.displayName,
          handle: igHandle,
          initials,
          clicks,
          orders: commData.orders,
          sales: commData.sales,
          commission: commData.commission,
          conversionRate,
          tier,
          tierColor,
          isInstagramConnected: creator.instagramConnection?.status === 'ACTIVE',
          color: tones[idx % tones.length],
        };
      })
      .sort((a: any, b: any) => b.sales - a.sales || b.orders - a.orders || b.clicks - a.clicks)
      .map((item: any, rank: number) => ({
        ...item,
        rank: rank + 1,
      }));

    // 5. Top Performing Products
    const productSalesMap = new Map<string, { product: any; sales: number; count: number }>();
    for (const link of affiliateLinks) {
      if (link.product) {
        const commsForLink = currentCommissions.filter((c: any) => c.linkId === link.id);
        const linkSales = sumTotal(commsForLink);
        const linkOrders = commsForLink.length;
        if (linkOrders > 0 || linkSales > 0) {
          const p = link.product;
          const existing = productSalesMap.get(p.id) || { product: p, sales: 0, count: 0 };
          existing.sales += linkSales;
          existing.count += linkOrders;
          productSalesMap.set(p.id, existing);
        }
      }
    }

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map(({ product, sales, count }) => ({
        id: product.id,
        name: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        sales,
        orders: count,
      }));

    return {
      summary: {
        totalInstagramClicks: {
          value: currentClicks,
          change: calcChange(currentClicks, previousClicks),
        },
        totalCreatorSales: {
          value: totalCreatorSales,
          change: calcChange(totalCreatorSales, prevCreatorSales),
        },
        totalCreatorOrders: {
          value: totalCreatorOrders,
          change: calcChange(totalCreatorOrders, prevCreatorOrders),
        },
        conversionRate: {
          value: overallConversionRate,
          change: Number((overallConversionRate - (previousClicks > 0 ? (prevCreatorOrders / previousClicks) * 100 : 0)).toFixed(1)),
        },
        totalCommissions: {
          value: totalCommissionsEarned,
          change: calcChange(totalCommissionsEarned, sumCommission(previousCommissions)),
        },
        avgOrderValue,
        totalStoreOrders: totalOrdersInRange,
      },
      timeline: Array.from(timelineMap.values()),
      placements,
      leaderboard,
      topProducts,
    };
  });
};
