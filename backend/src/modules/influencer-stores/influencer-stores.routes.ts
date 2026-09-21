import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';

const inrFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numberStandard = new Intl.NumberFormat('en-IN');

function formatCurrency(amount: number): string {
  return inrFormat.format(amount);
}

export const influencerStoresRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/influencer/stores/overview', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);

    // 1. Fetch assigned organizations or active fallback organizations
    let assignments = await prisma.storeInfluencerAssignment.findMany({
      where: { influencerId: actor.userId },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, shopDomain: true, logoUrl: true },
        },
      },
    });

    let stores = assignments.map((a: any) => a.organization);
    if (!stores.length) {
      stores = await prisma.organization.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, slug: true, shopDomain: true, logoUrl: true },
        take: 3,
      });
    }

    if (!stores.length) {
      stores = [
        { id: 'urban', name: 'Urban Threads', slug: 'urban-threads', shopDomain: 'urbanthreads.in' },
        { id: 'glow', name: 'Glow Theory', slug: 'glow-theory', shopDomain: 'glowtheory.in' },
        { id: 'kind', name: 'Kind Kitchen', slug: 'kind-kitchen', shopDomain: 'kindkitchen.in' },
      ];
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

    function computeBars(scopeComms: any[], scopeClicks: any[]): number[] {
      const buckets = new Array(12).fill(0);
      for (const c of scopeComms) {
        const cTime = new Date(c.createdAt).getTime();
        if (cTime >= thirtyDaysAgo.getTime()) {
          const idx = Math.min(11, Math.max(0, Math.floor((cTime - thirtyDaysAgo.getTime()) / bucketMs)));
          buckets[idx] += Number(c.orderAmount || c.amount || 0);
        }
      }

      const maxVal = Math.max(...buckets);
      if (maxVal > 0) {
        return buckets.map((v) => (v === 0 ? 0 : Math.max(20, Math.round((v / maxVal) * 100))));
      }

      const clickBuckets = new Array(12).fill(0);
      for (const cl of scopeClicks) {
        const clTime = new Date(cl.createdAt).getTime();
        if (clTime >= thirtyDaysAgo.getTime()) {
          const idx = Math.min(11, Math.max(0, Math.floor((clTime - thirtyDaysAgo.getTime()) / bucketMs)));
          clickBuckets[idx] += 1;
        }
      }
      const maxClicks = Math.max(...clickBuckets);
      if (maxClicks > 0) {
        return clickBuckets.map((v) => (v === 0 ? 0 : Math.max(20, Math.round((v / maxClicks) * 100))));
      }

      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const d20 = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const d10 = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const timelineLabels = [d30, d20, d10, 'Today'];

    // 3. Compute scopeData
    const scopeData: Record<
      string,
      { sales: string; orders: string; earnings: string; clicks: string; conversion: string; bars: number[] }
    > = {};

    const totalSalesAll = commissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount), 0);
    const totalEarningsAll = commissions.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
    const totalOrdersAll = commissions.length;
    const totalClicksAll = clicks.length;
    const convAll = totalClicksAll > 0 ? ((totalOrdersAll / totalClicksAll) * 100).toFixed(1) : '0.0';
    const allBars = computeBars(commissions, clicks);

    scopeData['all'] = {
      sales: formatCurrency(totalSalesAll),
      orders: String(totalOrdersAll),
      earnings: formatCurrency(totalEarningsAll),
      clicks: numberStandard.format(totalClicksAll),
      conversion: `${convAll}%`,
      bars: allBars,
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
      const storeBars = computeBars(storeComms, storeClicks);

      scopeData[store.slug || store.id] = {
        sales: formatCurrency(sSales),
        orders: String(sOrders),
        earnings: formatCurrency(sEarnings),
        clicks: numberStandard.format(sClicks),
        conversion: `${sConv}%`,
        bars: storeBars,
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

    // 4. Products for top shared list with real link clicks and commissions
    const orgIds = stores.map((s: any) => s.id).filter(Boolean);
    const dbProducts = await prisma.shopifyProduct.findMany({
      where: { organizationId: { in: orgIds } },
      include: {
        organization: { select: { name: true, slug: true } },
        affiliateLinks: {
          where: { creatorId: actor.userId },
          include: {
            _count: { select: { clicks: true, commissions: true } },
          },
        },
      },
      take: 20,
    });

    const tones = [
      'bg-violet-100 text-violet-600',
      'bg-rose-100 text-rose-600',
      'bg-teal-100 text-teal-600',
    ];

    let products: Array<{
      name: string;
      store: string;
      storeSlug: string;
      price: string;
      clicks: number;
      orders: number;
      tone: string;
    }> = [];

    if (dbProducts.length) {
      products = dbProducts
        .map((p: any, idx: number) => {
          const userLink = p.affiliateLinks?.[0];
          const pClicks = userLink?._count?.clicks ?? 0;
          const pOrders = userLink?._count?.commissions ?? 0;
          const numPrice = Number(p.price || 0);
          return {
            name: p.title,
            store: p.organization?.name || 'Brand Store',
            storeSlug: p.organization?.slug || 'store',
            price: numPrice > 0 ? formatCurrency(numPrice) : (p.price ? `₹${p.price}` : '₹0.00'),
            clicks: pClicks,
            orders: pOrders,
            tone: tones[idx % tones.length],
          };
        })
        .sort((a: any, b: any) => (b.orders - a.orders) || (b.clicks - a.clicks));
    }

    return {
      stores: stores.map((s: any) => ({ id: s.id, name: s.name, slug: s.slug || s.id })),
      scopeData,
      storeMix,
      products,
      timelineBars: allBars,
      timelineLabels,
    };
  });
};
