import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';

const inrCurrency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const influencerEarningsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/influencer/earnings', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const query = request.query as { scope?: string };

    const where: any = {
      creatorId: actor.userId,
    };

    if (query.scope && query.scope !== 'all') {
      where.organization = {
        OR: [
          { slug: query.scope },
          { id: query.scope },
        ],
      };
    }

    const [allCommissions, allPayouts, barterFulfillments] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true, slug: true } },
          shopifyOrder: { select: { name: true, total: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.campaignPayout.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true, slug: true } },
          campaign: { select: { title: true, compensationType: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.barterSampleFulfillment.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true, slug: true } },
          campaign: { select: { title: true } },
          product: { select: { title: true, imageUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let availableToWithdraw = 0;
    let pendingApproval = 0;
    let lifetimeEarnings = 0;
    let paidEarnings = 0;

    for (const comm of allCommissions) {
      const amount = Number(comm.amount);
      if (comm.status === 'APPROVED') {
        availableToWithdraw += amount;
        lifetimeEarnings += amount;
      } else if (comm.status === 'PENDING') {
        pendingApproval += amount;
      } else if (comm.status === 'PAID') {
        paidEarnings += amount;
        lifetimeEarnings += amount;
      }
    }

    for (const payout of allPayouts) {
      const amount = Number(payout.amount);
      if (payout.status === 'APPROVED') {
        availableToWithdraw += amount;
        lifetimeEarnings += amount;
      } else if (payout.status === 'PENDING') {
        pendingApproval += amount;
      } else if (payout.status === 'PAID') {
        paidEarnings += amount;
        lifetimeEarnings += amount;
      }
    }

    // Monthly timeline for the last 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const timelineMap = new Map<string, { label: string; amount: number; sales: number; count: number }>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      timelineMap.set(key, {
        label: monthNames[d.getMonth()],
        amount: 0,
        sales: 0,
        count: 0,
      });
    }

    for (const comm of allCommissions) {
      if (comm.status === 'REVERSED') continue;
      const d = new Date(comm.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = timelineMap.get(key);
      if (entry) {
        entry.amount += Number(comm.amount);
        entry.sales += Number(comm.orderAmount);
        entry.count += 1;
      }
    }

    for (const payout of allPayouts) {
      if (payout.status === 'CANCELLED') continue;
      const d = new Date(payout.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = timelineMap.get(key);
      if (entry) {
        entry.amount += Number(payout.amount);
        entry.count += 1;
      }
    }

    const timeline = [...timelineMap.values()].map((item) => ({
      month: item.label,
      earnings: item.amount,
      earningsFormatted: inrCurrency.format(item.amount),
      sales: item.sales,
      orders: item.count,
    }));

    // Current period vs previous month
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const currentPeriodAmount = timelineMap.get(currentMonthKey)?.amount ?? 0;
    const prevPeriodAmount = timelineMap.get(prevMonthKey)?.amount ?? 0;
    const percentChange = prevPeriodAmount > 0
      ? ((currentPeriodAmount - prevPeriodAmount) / prevPeriodAmount) * 100
      : currentPeriodAmount > 0 ? 100 : 0;

    // Build unified recent transactions list across Commissions & Fixed/Hybrid Payouts
    const unifiedTransactions = [
      ...allCommissions.map((comm: any) => ({
        id: comm.id,
        type: 'COMMISSION',
        orderName: comm.shopifyOrder?.name ?? 'Order Commission',
        storeName: comm.organization?.name ?? 'Store',
        amount: inrCurrency.format(comm.status === 'REVERSED' ? 0 : Number(comm.amount)),
        amountRaw: comm.status === 'REVERSED' ? 0 : Number(comm.amount),
        status: comm.status,
        date: new Date(comm.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        rawDate: comm.createdAt,
      })),
      ...allPayouts.map((payout: any) => ({
        id: payout.id,
        type: payout.type, // FIXED_FEE or HYBRID_BASE
        orderName: `${payout.campaign?.title ?? 'Campaign'} (${payout.type === 'HYBRID_BASE' ? 'Hybrid Base' : 'Fixed Fee'})`,
        storeName: payout.organization?.name ?? 'Store',
        amount: inrCurrency.format(payout.status === 'CANCELLED' ? 0 : Number(payout.amount)),
        amountRaw: payout.status === 'CANCELLED' ? 0 : Number(payout.amount),
        status: payout.status,
        date: new Date(payout.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        rawDate: payout.createdAt,
      })),
    ].sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

    return {
      balances: {
        availableToWithdraw: inrCurrency.format(availableToWithdraw),
        availableToWithdrawRaw: availableToWithdraw,
        pendingApproval: inrCurrency.format(pendingApproval),
        pendingApprovalRaw: pendingApproval,
        pendingOrdersCount:
          allCommissions.filter((c: any) => c.status === 'PENDING').length +
          allPayouts.filter((p: any) => p.status === 'PENDING').length,
        lifetimeEarnings: inrCurrency.format(lifetimeEarnings),
        lifetimeEarningsRaw: lifetimeEarnings,
        paidEarnings: inrCurrency.format(paidEarnings),
        currentPeriodEarnings: inrCurrency.format(currentPeriodAmount),
        growthRate: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`,
        isGrowthPositive: percentChange >= 0,
      },
      timeline,
      recentCommissions: unifiedTransactions.slice(0, 15),
      barterFulfillments: barterFulfillments.map((b: any) => ({
        id: b.id,
        campaignTitle: b.campaign?.title ?? 'Barter Campaign',
        storeName: b.organization?.name ?? 'Store',
        productTitle: b.productTitle,
        trackingNumber: b.trackingNumber,
        carrier: b.carrier,
        status: b.status,
        shippedAt: b.shippedAt ? new Date(b.shippedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null,
        deliveredAt: b.deliveredAt ? new Date(b.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null,
      })),
    };
  });
};
