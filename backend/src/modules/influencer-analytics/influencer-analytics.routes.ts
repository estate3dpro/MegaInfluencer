import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { getInstagramProfile, listInstagramMedia } from '../instagram/instagram.service.js';

const numberCompact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
const numberStandard = new Intl.NumberFormat('en-IN');
const inrCurrency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatChange(current: number, previous: number): string {
  if (!previous) return current > 0 ? '+100%' : '+0%';
  const diff = ((current - previous) / previous) * 100;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}%`;
}

function formatInr(amount: number): string {
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2).replace(/\.00$/, '')}L`;
  }
  return inrCurrency.format(amount);
}

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

export const influencerAnalyticsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/influencer/analytics', async (request) => {
    const actor = requireRole(request, ['INFLUENCER', 'CUSTOMER']);
    const query = request.query as {
      range?: 'today' | '7d' | '30d' | '90d' | 'all';
      platform?: string;
      storeId?: string;
    };

    const days = query.range === 'today' ? 1 : query.range === '7d' ? 7 : query.range === '90d' ? 90 : query.range === 'all' ? 365 : 30;

    const now = new Date();
    const startDate = query.range === 'today'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    const activeCommissionFilter: any = {
      creatorId: actor.userId,
      status: { not: 'REVERSED' as const },
    };

    const linkWhere: any = { creatorId: actor.userId };
    if (query.storeId && query.storeId !== 'all') {
      linkWhere.organizationId = query.storeId;
      activeCommissionFilter.organizationId = query.storeId;
    }

    // 1. Fetch assigned stores for filter dropdown
    const assignedStores = await prisma.organization.findMany({
      where: {
        OR: [
          { assignments: { some: { influencerId: actor.userId } } },
          { affiliateLinks: { some: { creatorId: actor.userId } } },
        ],
      },
      select: { id: true, name: true, slug: true },
    });

    // 2. Fetch live DB metrics (clicks, orders, commissions)
    const [
      allClicksInRange,
      prevClicksCount,
      currentCommissions,
      previousCommissions,
    ] = await Promise.all([
      prisma.affiliateLinkClick.findMany({
        where: {
          link: linkWhere,
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          linkId: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          visitorHash: true,
          referrer: true,
          createdAt: true,
        },
      }),
      prisma.affiliateLinkClick.count({
        where: {
          link: linkWhere,
          createdAt: { gte: prevStartDate, lt: startDate },
        },
      }),
      prisma.affiliateCommission.findMany({
        where: { ...activeCommissionFilter, createdAt: { gte: startDate } },
        select: {
          id: true,
          amount: true,
          orderAmount: true,
          linkId: true,
          createdAt: true,
          shopifyOrder: { select: { id: true, name: true, payload: true } },
        },
      }),
      prisma.affiliateCommission.findMany({
        where: { ...activeCommissionFilter, createdAt: { gte: prevStartDate, lt: startDate } },
        select: { amount: true, orderAmount: true },
      }),
    ]);

    const selectedPlatformFilter = query.platform && query.platform !== 'all' ? query.platform.toLowerCase() : null;

    // Platform aggregation map strictly for supported platforms (WhatsApp, Facebook, Instagram, Custom)
    const platformMap = new Map<string, {
      platform: string;
      name: string;
      clicks: number;
      visitors: Set<string>;
      orders: number;
      sales: number;
      earnings: number;
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
        earnings: 0,
        topMedium: key === 'custom' ? 'custom' : 'social',
        mediumCounts: {},
        color: cfg.color,
        badgeClass: cfg.bg,
      });
    });

    // Bucket clicks
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

    // Attribute orders/commissions
    for (const comm of currentCommissions) {
      let matchedPlatform = 'custom';
      const orderPayload = (comm.shopifyOrder?.payload as any) || {};
      if (orderPayload.platform) {
        matchedPlatform = normalizePlatform(orderPayload.platform);
      } else {
        const matchingClick = allClicksInRange.find((c: any) => c.linkId === comm.linkId);
        if (matchingClick) {
          matchedPlatform = normalizePlatform(matchingClick.utmSource, matchingClick.referrer);
        }
      }

      const entry = platformMap.get(matchedPlatform) || platformMap.get('custom')!;
      entry.orders += 1;
      entry.sales += Number(comm.orderAmount || 0);
      entry.earnings += Number(comm.amount || 0);
    }

    const totalClicksCount = allClicksInRange.length;
    const totalSalesCurrent = currentCommissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount || 0), 0);
    const totalSalesPrevious = previousCommissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount || 0), 0);
    const totalEarningsCurrent = currentCommissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const totalOrdersCount = currentCommissions.length;

    // Platform breakdown list strictly for WhatsApp, Facebook, Instagram, Custom
    const platformBreakdown = Array.from(platformMap.values())
      .map((p) => {
        const convRate = p.clicks > 0 ? Number(((p.orders / p.clicks) * 100).toFixed(1)) : 0;
        const share = totalClicksCount > 0 ? Number(((p.clicks / totalClicksCount) * 100).toFixed(1)) : 0;
        return {
          platform: p.platform,
          name: p.name,
          clicks: p.clicks,
          uniqueVisitors: p.visitors.size || p.clicks,
          orders: p.orders,
          sales: p.sales,
          earnings: p.earnings,
          conversionRate: convRate,
          share,
          topMedium: p.topMedium,
          color: p.color,
          badgeClass: p.badgeClass,
        };
      })
      .sort((a, b) => b.clicks - a.clicks || b.sales - a.sales);

    // Build day-by-day Timeline
    const timelineSteps = Math.min(days, 30);
    const stepSize = Math.max(1, Math.floor(days / timelineSteps));
    const timelineMap = new Map<string, any>();

    for (let i = 0; i < timelineSteps; i++) {
      const d = new Date(startDate.getTime() + i * stepSize * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().slice(0, 10);
      const dayLabel = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
      timelineMap.set(iso, {
        date: iso,
        day: dayLabel,
        totalClicks: 0,
        totalOrders: 0,
        totalSales: 0,
        totalEarnings: 0,
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
          const dayLabel = `${click.createdAt.getDate()} ${click.createdAt.toLocaleString('default', { month: 'short' })}`;
          item = {
            date: iso,
            day: dayLabel,
            totalClicks: 0,
            totalOrders: 0,
            totalSales: 0,
            totalEarnings: 0,
            whatsappClicks: 0,
            facebookClicks: 0,
            instagramClicks: 0,
            customClicks: 0,
          };
          timelineMap.set(iso, item);
        }

        const p = normalizePlatform(click.utmSource, click.referrer);
        item.totalClicks += 1;
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
          item.totalOrders += 1;
          item.totalSales += Number(comm.orderAmount || 0);
          item.totalEarnings += Number(comm.amount || 0);
        }
      }
    }

    const platformTimeline = Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Instagram profile metrics
    let igProfile: any = null;
    try {
      const igData = await getInstagramProfile(app, actor.userId);
      igProfile = igData?.profile;
    } catch {
      // ignore
    }

    const overview = [
      {
        label: 'Total Platform Clicks',
        value: numberStandard.format(totalClicksCount),
        change: formatChange(totalClicksCount, prevClicksCount),
      },
      {
        label: 'Attributed Sales',
        value: formatInr(totalSalesCurrent),
        change: formatChange(totalSalesCurrent, totalSalesPrevious),
      },
      {
        label: 'Commission Earned',
        value: formatInr(totalEarningsCurrent),
        change: formatChange(totalEarningsCurrent, previousCommissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0)),
      },
      {
        label: 'Total Orders',
        value: numberStandard.format(totalOrdersCount),
        change: formatChange(totalOrdersCount, previousCommissions.length),
      },
    ];

    const conversionImpact = {
      linkClicks: numberStandard.format(totalClicksCount),
      linkClicksDetail: `${totalClicksCount > 0 ? ((totalOrdersCount / totalClicksCount) * 100).toFixed(1) : '0.0'}% overall conversion`,
      attributedSales: formatInr(totalSalesCurrent),
      attributedSalesDetail: `${formatChange(totalSalesCurrent, totalSalesPrevious)} vs. previous`,
      ordersGenerated: String(totalOrdersCount),
      ordersGeneratedDetail: `₹${totalOrdersCount > 0 ? (totalSalesCurrent / totalOrdersCount).toFixed(2) : '0.00'} average order value`,
    };

    return {
      overview,
      summary: {
        totalClicks: totalClicksCount,
        totalOrders: totalOrdersCount,
        totalSales: totalSalesCurrent,
        totalEarnings: totalEarningsCurrent,
        conversionRate: totalClicksCount > 0 ? Number(((totalOrdersCount / totalClicksCount) * 100).toFixed(2)) : 0,
        avgOrderValue: totalOrdersCount > 0 ? Math.round(totalSalesCurrent / totalOrdersCount) : 0,
      },
      platformBreakdown: selectedPlatformFilter
        ? platformBreakdown.filter((p) => p.platform === selectedPlatformFilter)
        : platformBreakdown,
      allPlatforms: platformBreakdown,
      platformTimeline,
      storesList: assignedStores,
      conversionImpact,
    };
  });
};
