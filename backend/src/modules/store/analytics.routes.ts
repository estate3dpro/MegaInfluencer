import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

function normalizePlatform(utmSource?: string | null, referrer?: string | null): string {
  const src = (utmSource || '').toLowerCase().trim();
  const ref = (referrer || '').toLowerCase().trim();

  if (src.includes('whatsapp') || src.includes('wa') || ref.includes('whatsapp') || ref.includes('wa.me')) return 'whatsapp';
  if (src.includes('facebook') || src.includes('fb') || ref.includes('facebook') || ref.includes('fb.me')) return 'facebook';
  if (src.includes('instagram') || src.includes('ig') || ref.includes('instagram')) return 'instagram';
  return 'custom';
}

const PLATFORM_CONFIG: Record<string, { name: string; color: string; bg: string }> = {
  whatsapp: { name: 'WhatsApp', color: '#10b981', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  facebook: { name: 'Facebook', color: '#1877f2', bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  instagram: { name: 'Instagram', color: '#e1306c', bg: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  custom: { name: 'Custom UTM / Direct', color: '#6366f1', bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
};

export const storeAnalyticsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/store/analytics', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER', 'ADMIN']);
    const query = request.query as {
      range?: 'today' | '7d' | '30d' | '90d' | 'all';
      platform?: string;
      creatorId?: string;
    };
    const days = query.range === 'today' ? 1 : query.range === '7d' ? 7 : query.range === '90d' ? 90 : query.range === 'all' ? 365 : 30;

    const organization = await prisma.organization.findFirst({
      where: { ownerId: actor.userId },
      select: { id: true, name: true, shopDomain: true },
    });

    if (!organization) {
      throw new AppError('STORE_NOT_FOUND', 'Organization not found.', 404);
    }

    const now = new Date();
    const startDate = query.range === 'today'
      ? startOfDay(now)
      : startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
    const prevStartDate = startOfDay(new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000));

    const activeCommissionWhere: any = {
      organizationId: organization.id,
      status: { not: 'REVERSED' as const },
    };

    const clickWhere: any = {
      organizationId: organization.id,
    };

    if (query.creatorId && query.creatorId !== 'all') {
      activeCommissionWhere.creatorId = query.creatorId;
      clickWhere.link = { creatorId: query.creatorId };
    }

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
        where: { ...clickWhere, createdAt: { gte: startDate } },
      }),
      prisma.affiliateLinkClick.count({
        where: { ...clickWhere, createdAt: { gte: prevStartDate, lt: startDate } },
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
          shopifyOrder: { select: { id: true, name: true, total: true, payload: true } },
        },
      }),
      prisma.affiliateCommission.findMany({
        where: { ...activeCommissionWhere, createdAt: { gte: prevStartDate, lt: startDate } },
        select: { amount: true, orderAmount: true, creatorId: true },
      }),
      prisma.affiliateLinkClick.findMany({
        where: { ...clickWhere, createdAt: { gte: startDate } },
        select: {
          id: true,
          linkId: true,
          visitorHash: true,
          utmMedium: true,
          utmSource: true,
          referrer: true,
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
          influencerProfile: { select: { firstName: true, lastName: true } },
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

    // Platform aggregation map strictly for WhatsApp, Facebook, Instagram, Custom
    const platformMap = new Map<string, {
      platform: string;
      name: string;
      clicks: number;
      visitors: Set<string>;
      orders: number;
      sales: number;
      commissions: number;
      topMedium: string;
      mediumCounts: Record<string, number>;
      color: string;
      badgeClass: string;
    }>();

    Object.entries(PLATFORM_CONFIG).forEach(([key, cfg]) => {
      platformMap.set(key, {
        platform: key,
        name: cfg.name,
        clicks: 0,
        visitors: new Set<string>(),
        orders: 0,
        sales: 0,
        commissions: 0,
        topMedium: key === 'custom' ? 'custom' : 'social',
        mediumCounts: {},
        color: cfg.color,
        badgeClass: cfg.bg,
      });
    });

    for (const c of allClicksInRange) {
      const pKey = normalizePlatform(c.utmSource, c.referrer);
      const entry = platformMap.get(pKey) || platformMap.get('custom')!;
      entry.clicks += 1;
      if (c.visitorHash) entry.visitors.add(c.visitorHash);
      if (c.utmMedium) {
        entry.mediumCounts[c.utmMedium] = (entry.mediumCounts[c.utmMedium] || 0) + 1;
      }
    }

    platformMap.forEach((entry) => {
      const topM = Object.entries(entry.mediumCounts).sort((a, b) => b[1] - a[1])[0];
      if (topM) entry.topMedium = topM[0];
    });

    for (const comm of currentCommissions) {
      let matchedPlatform = 'custom';
      const orderPayload = (comm.shopifyOrder?.payload as any) || {};
      if (orderPayload.platform) {
        matchedPlatform = normalizePlatform(orderPayload.platform);
      } else {
        const matchingClick = allClicksInRange.find((c) => c.linkId === comm.linkId);
        if (matchingClick) {
          matchedPlatform = normalizePlatform(matchingClick.utmSource, matchingClick.referrer);
        }
      }

      const entry = platformMap.get(matchedPlatform) || platformMap.get('custom')!;
      entry.orders += 1;
      entry.sales += Number(comm.orderAmount || 0);
      entry.commissions += Number(comm.amount || 0);
    }

    const platformBreakdown = Array.from(platformMap.values())
      .map((p) => {
        const convRate = p.clicks > 0 ? Number(((p.orders / p.clicks) * 100).toFixed(1)) : 0;
        const share = currentClicks > 0 ? Number(((p.clicks / currentClicks) * 100).toFixed(1)) : 0;
        return {
          platform: p.platform,
          name: p.name,
          clicks: p.clicks,
          uniqueVisitors: p.visitors.size || p.clicks,
          orders: p.orders,
          sales: p.sales,
          commissions: p.commissions,
          conversionRate: convRate,
          share,
          topMedium: p.topMedium,
          color: p.color,
          badgeClass: p.badgeClass,
        };
      })
      .sort((a, b) => b.clicks - a.clicks || b.sales - a.sales);

    // Timeline Aggregation (Day by Day)
    const timelineSteps = Math.min(days, 30);
    const stepSize = Math.max(1, Math.floor(days / timelineSteps));
    const timelineMap = new Map<string, any>();

    for (let i = 0; i < timelineSteps; i++) {
      const d = new Date(startDate.getTime() + i * stepSize * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().slice(0, 10);
      const dayStr = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
      timelineMap.set(iso, {
        date: iso,
        day: dayStr,
        clicks: 0,
        orders: 0,
        sales: 0,
        commissions: 0,
        whatsappClicks: 0,
        facebookClicks: 0,
        instagramClicks: 0,
        customClicks: 0,
      });
    }

    for (const click of allClicksInRange) {
      if (click.createdAt) {
        const iso = click.createdAt.toISOString().slice(0, 10);
        let item = timelineMap.get(iso);
        if (!item) {
          const dayStr = `${click.createdAt.getDate()} ${click.createdAt.toLocaleString('default', { month: 'short' })}`;
          item = {
            date: iso,
            day: dayStr,
            clicks: 0,
            orders: 0,
            sales: 0,
            commissions: 0,
            whatsappClicks: 0,
            facebookClicks: 0,
            instagramClicks: 0,
            customClicks: 0,
          };
          timelineMap.set(iso, item);
        }

        const p = normalizePlatform(click.utmSource, click.referrer);
        item.clicks += 1;
        if (p === 'whatsapp') item.whatsappClicks += 1;
        else if (p === 'facebook') item.facebookClicks += 1;
        else if (p === 'instagram') item.instagramClicks += 1;
        else item.customClicks += 1;
      }
    }

    for (const comm of currentCommissions) {
      if (comm.createdAt) {
        const iso = comm.createdAt.toISOString().slice(0, 10);
        const item = timelineMap.get(iso);
        if (item) {
          item.orders += 1;
          item.sales += Number(comm.orderAmount || 0);
          item.commissions += Number(comm.amount || 0);
        }
      }
    }

    const timeline = Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Creator Leaderboard
    const creatorClicksMap = new Map<string, number>();
    for (const click of allClicksInRange) {
      const cId = click.link?.creatorId;
      if (cId) {
        creatorClicksMap.set(cId, (creatorClicksMap.get(cId) ?? 0) + 1);
      }
    }

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

    // Top Products
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

    const selectedPlatformFilter = query.platform && query.platform !== 'all' ? query.platform.toLowerCase() : null;

    return {
      summary: {
        totalClicks: {
          value: currentClicks,
          change: calcChange(currentClicks, previousClicks),
        },
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
      platformBreakdown: selectedPlatformFilter
        ? platformBreakdown.filter((p) => p.platform === selectedPlatformFilter)
        : platformBreakdown,
      allPlatforms: platformBreakdown,
      platformTimeline: timeline,
      timeline,
      creatorsList: creatorsWithUsers.map((c: any) => ({ id: c.id, name: c.displayName, code: c.creatorCode })),
      leaderboard,
      topProducts,
    };
  });
};
