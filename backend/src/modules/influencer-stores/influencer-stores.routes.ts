import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { getAssignedProductIds } from '../product-assignments/product-assignments.service.js';

const inrFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numberStandard = new Intl.NumberFormat('en-IN');

function formatCurrency(amount: number): string {
  return inrFormat.format(amount);
}

export const influencerStoresRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/influencer/stores/overview', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);

    // 1. Fetch only assigned organizations for this influencer
    const assignments = await prisma.storeInfluencerAssignment.findMany({
      where: { influencerId: actor.userId },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, shopDomain: true, logoUrl: true },
        },
      },
    });

    let stores = assignments.map((a: any) => a.organization).filter(Boolean);

    // If no direct assignment yet, check if creator has affiliate links with organizations
    if (!stores.length) {
      const creatorLinks = await prisma.affiliateLink.findMany({
        where: { creatorId: actor.userId },
        select: {
          organization: { select: { id: true, name: true, slug: true, shopDomain: true, logoUrl: true } },
        },
        distinct: ['organizationId'],
      });
      stores = creatorLinks.map((l: any) => l.organization).filter(Boolean);
    }

    // 2. Fetch commissions & clicks
    const commissions = await prisma.affiliateCommission.findMany({
      where: { creatorId: actor.userId, status: { not: 'REVERSED' } },
      select: { organizationId: true, amount: true, orderAmount: true, createdAt: true },
    });

    const clicks = await prisma.affiliateLinkClick.findMany({
      where: { link: { creatorId: actor.userId } },
      select: { organizationId: true, createdAt: true },
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const bucketMs = (30 * 24 * 60 * 60 * 1000) / 12;

    function buildTimeline(scopeComms: any[], scopeClicks: any[]) {
      const intervals = Array.from({ length: 12 }, (_, i) => {
        const stepStart = new Date(thirtyDaysAgo.getTime() + i * bucketMs);
        const stepEnd = new Date(thirtyDaysAgo.getTime() + (i + 1) * bucketMs);
        const label = i === 11 ? 'Today' : stepStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        return {
          start: stepStart.getTime(),
          end: stepEnd.getTime(),
          label,
          date: stepStart.toISOString().split('T')[0],
          sales: 0,
          orders: 0,
          clicks: 0,
        };
      });

      for (const c of scopeComms) {
        const cTime = new Date(c.createdAt).getTime();
        if (cTime >= thirtyDaysAgo.getTime()) {
          const idx = Math.min(11, Math.max(0, Math.floor((cTime - thirtyDaysAgo.getTime()) / bucketMs)));
          intervals[idx].sales += Number(c.orderAmount || 0);
          intervals[idx].orders += 1;
        }
      }

      for (const cl of scopeClicks) {
        const clTime = new Date(cl.createdAt).getTime();
        if (clTime >= thirtyDaysAgo.getTime()) {
          const idx = Math.min(11, Math.max(0, Math.floor((clTime - thirtyDaysAgo.getTime()) / bucketMs)));
          intervals[idx].clicks += 1;
        }
      }

      const maxSales = Math.max(...intervals.map((item) => item.sales));
      const maxClicks = Math.max(...intervals.map((item) => item.clicks));

      return intervals.map((item) => {
        let height = 0;
        if (maxSales > 0) {
          height = item.sales === 0 ? 0 : Math.max(20, Math.round((item.sales / maxSales) * 100));
        } else if (maxClicks > 0) {
          height = item.clicks === 0 ? 0 : Math.max(20, Math.round((item.clicks / maxClicks) * 100));
        }
        return {
          label: item.label,
          date: item.date,
          sales: Number(item.sales.toFixed(2)),
          salesFormatted: formatCurrency(item.sales),
          orders: item.orders,
          clicks: item.clicks,
          height,
        };
      });
    }

    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
    const d20 = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
    const d10 = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
    const timelineLabels = [d30, d20, d10, 'Today'];

    // 3. Compute scopeData
    const scopeData: Record<
      string,
      {
        sales: string;
        orders: string;
        earnings: string;
        clicks: string;
        conversion: string;
        bars: number[];
        timeline: Array<{
          label: string;
          date: string;
          sales: number;
          salesFormatted: string;
          orders: number;
          clicks: number;
          height: number;
        }>;
      }
    > = {};

    const totalSalesAll = commissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount), 0);
    const totalEarningsAll = commissions.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
    const totalOrdersAll = commissions.length;
    const totalClicksAll = clicks.length;
    const convAll = totalClicksAll > 0 ? ((totalOrdersAll / totalClicksAll) * 100).toFixed(1) : '0.0';
    const allTimeline = buildTimeline(commissions, clicks);
    const allBars = allTimeline.map((t) => t.height);

    scopeData['all'] = {
      sales: formatCurrency(totalSalesAll),
      orders: String(totalOrdersAll),
      earnings: formatCurrency(totalEarningsAll),
      clicks: numberStandard.format(totalClicksAll),
      conversion: `${convAll}%`,
      bars: allBars,
      timeline: allTimeline,
    };

    const storeMix: Array<{ name: string; percentage: number }> = [];

    stores.forEach((store: any) => {
      const storeComms = commissions.filter((c: any) => c.organizationId === store.id);
      const storeClicks = clicks.filter((cl: any) => cl.organizationId === store.id);
      const sSales = storeComms.reduce((sum: number, c: any) => sum + Number(c.orderAmount), 0);
      const sEarnings = storeComms.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
      const sOrders = storeComms.length;
      const sClicks = storeClicks.length;
      const sConv = sClicks > 0 ? ((sOrders / sClicks) * 100).toFixed(1) : '0.0';
      const storeTimeline = buildTimeline(storeComms, storeClicks);
      const storeBars = storeTimeline.map((t) => t.height);

      scopeData[store.slug || store.id] = {
        sales: formatCurrency(sSales),
        orders: String(sOrders),
        earnings: formatCurrency(sEarnings),
        clicks: numberStandard.format(sClicks),
        conversion: `${sConv}%`,
        bars: storeBars,
        timeline: storeTimeline,
      };

      let percent = 0;
      if (totalSalesAll > 0) {
        percent = Math.round((sSales / totalSalesAll) * 100);
      } else if (totalClicksAll > 0) {
        percent = Math.round((sClicks / totalClicksAll) * 100);
      } else {
        percent = stores.length === 1 ? 100 : Math.round(100 / stores.length);
      }

      storeMix.push({
        name: store.name,
        percentage: percent,
      });
    });

    // 4. Products strictly assigned to this creator by store admin
    const orgIds = stores.map((s: any) => s.id).filter(Boolean);
    let dbProducts: any[] = [];
    if (orgIds.length > 0) {
      const assignedProductIds = await getAssignedProductIds(prisma, actor.userId);

      if (assignedProductIds.length > 0) {
        dbProducts = await prisma.shopifyProduct.findMany({
          where: {
            organizationId: { in: orgIds },
            id: { in: assignedProductIds },
          },
          include: {
            organization: { select: { name: true, slug: true } },
            affiliateLinks: {
              where: { creatorId: actor.userId },
              include: {
                _count: { select: { clicks: true, commissions: true } },
              },
            },
          },
          take: 30,
        });
      }
    }

    const tones = [
      'bg-violet-100 text-violet-600',
      'bg-rose-100 text-rose-600',
      'bg-teal-100 text-teal-600',
    ];

    const products = dbProducts
      .map((p: any, idx: number) => {
        const userLink = p.affiliateLinks?.[0];
        const pClicks = userLink?._count?.clicks ?? 0;
        const pOrders = userLink?._count?.commissions ?? 0;
        const numPrice = Number(p.price || 0);
        return {
          id: p.id,
          name: p.title,
          store: p.organization?.name || 'Brand Store',
          storeSlug: p.organization?.slug || 'store',
          price: numPrice > 0 ? formatCurrency(numPrice) : (p.price ? `₹${p.price}` : '₹0.00'),
          clicks: pClicks,
          orders: pOrders,
          tone: tones[idx % tones.length],
          imageUrl: p.imageUrl ?? null,
          affiliateSlug: userLink?.slug ?? null,
        };
      })
      .sort((a: any, b: any) => (b.orders - a.orders) || (b.clicks - a.clicks));

    return {
      stores: stores.map((s: any) => ({ id: s.id, name: s.name, slug: s.slug || s.id })),
      scopeData,
      storeMix,
      products,
      timelineBars: allBars,
      timelineLabels,
      timeline: allTimeline,
    };
  });
};
