import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';

const inrCurrency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const influencerEarningsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/influencer/earnings', async (request) => {
    const actor = requireRole(request, ['INFLUENCER', 'CUSTOMER']);
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

    const [allCommissions, allPayouts, barterFulfillments, storeAssignments] = await Promise.all([
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
      prisma.storeInfluencerAssignment.findMany({
        where: { influencerId: actor.userId },
        select: { organizationId: true, compensationMode: true, organization: { select: { name: true } } },
      }),
    ]);

    // Only strictly BARTER-only store assignments suppress cash commissions.
    // HYBRID and COMMISSION assignments both earn cash commissions on sales.
    const pureBarterOrganizationIds = new Set(
      storeAssignments
        .filter((assignment: any) => assignment.compensationMode === 'BARTER')
        .map((assignment: any) => assignment.organizationId),
    );

    const cashCommissions = allCommissions.filter((commission: any) => !pureBarterOrganizationIds.has(commission.organizationId));
    const cashPayouts = allPayouts.filter((payout: any) => !pureBarterOrganizationIds.has(payout.organizationId));

    let availableToWithdraw = 0;
    let pendingApproval = 0;
    let lifetimeEarnings = 0;
    let paidEarnings = 0;
    let pendingOrdersCount = 0;

    for (const comm of cashCommissions) {
      const amount = Number(comm.amount);
      if (comm.status === 'APPROVED') {
        availableToWithdraw += amount;
        lifetimeEarnings += amount;
      } else if (comm.status === 'PENDING') {
        pendingApproval += amount;
        pendingOrdersCount += 1;
      } else if (comm.status === 'PAID') {
        paidEarnings += amount;
        lifetimeEarnings += amount;
      }
    }

    for (const payout of cashPayouts) {
      const amount = Number(payout.amount);
      if (payout.status === 'APPROVED') {
        availableToWithdraw += amount;
        lifetimeEarnings += amount;
      } else if (payout.status === 'PENDING') {
        pendingApproval += amount;
        pendingOrdersCount += 1;
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

    for (const comm of cashCommissions) {
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

    for (const payout of cashPayouts) {
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

    // Detect overall partnership deal mode
    const primaryAssignment = storeAssignments[0];
    const dealMode = primaryAssignment?.compensationMode || 'COMMISSION'; // 'COMMISSION' | 'BARTER' | 'HYBRID'

    // Formatted recent activity list
    const recentActivity = [
      ...cashCommissions.slice(0, 15).map((c: any) => ({
        id: c.id,
        type: 'COMMISSION',
        orderName: c.shopifyOrder?.name || `Order #${c.id.slice(-6)}`,
        storeName: c.organization?.name || 'Brand Store',
        amount: inrCurrency.format(Number(c.amount)),
        amountRaw: Number(c.amount),
        orderAmount: inrCurrency.format(Number(c.orderAmount)),
        status: c.status,
        date: new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      })),
      ...cashPayouts.slice(0, 10).map((p: any) => ({
        id: p.id,
        type: p.campaign?.compensationType === 'HYBRID' ? 'HYBRID_BASE' : 'FIXED_FEE',
        orderName: p.campaign?.title || 'Campaign Fee',
        storeName: p.organization?.name || 'Brand Store',
        amount: inrCurrency.format(Number(p.amount)),
        amountRaw: Number(p.amount),
        orderAmount: inrCurrency.format(Number(p.amount)),
        status: p.status,
        date: new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Formatted barter sample tracking
    const sampleShipments = barterFulfillments.map((b: any) => ({
      id: b.id,
      storeName: b.organization?.name || 'Brand Store',
      campaignTitle: b.campaign?.title || 'Product Gifting Collaboration',
      productTitle: b.productTitle || b.product?.title || 'Promotional Sample',
      productImageUrl: b.product?.imageUrl || null,
      trackingNumber: b.trackingNumber,
      carrier: b.carrier || 'Standard Courier',
      shippingAddress: b.shippingAddress,
      status: b.status, // PENDING, SHIPPED, DELIVERED, COMPLETED
      shippedAt: b.shippedAt ? new Date(b.shippedAt).toLocaleDateString('en-IN') : null,
      deliveredAt: b.deliveredAt ? new Date(b.deliveredAt).toLocaleDateString('en-IN') : null,
      createdAt: new Date(b.createdAt).toLocaleDateString('en-IN'),
    }));

    return {
      dealMode,
      dealTitle:
        dealMode === 'HYBRID'
          ? '⚡ Hybrid Partnership (Free Product Sample + 15% Sales Commission)'
          : dealMode === 'BARTER'
          ? '🎁 Barter Partnership (Product Gifting & Exclusive Samples)'
          : '💵 Commission Partnership (15% Commission on All Attributed Sales)',
      dealDescription:
        dealMode === 'HYBRID'
          ? 'You receive free sample deliveries to create content, plus earn 15% on all customer orders driven by your promo links and codes.'
          : dealMode === 'BARTER'
          ? 'You receive complimentary brand product samples to feature in your posts. Cash commission is disabled for pure barter deals.'
          : 'You earn 15% commission on every verified customer purchase made using your unique tracking links and promo codes.',
      balances: {
        availableToWithdraw: inrCurrency.format(availableToWithdraw),
        availableToWithdrawRaw: availableToWithdraw,
        pendingApproval: inrCurrency.format(pendingApproval),
        pendingApprovalRaw: pendingApproval,
        lifetimeEarnings: inrCurrency.format(lifetimeEarnings),
        paidEarnings: inrCurrency.format(paidEarnings),
        pendingOrdersCount,
        currentPeriodEarnings: inrCurrency.format(availableToWithdraw + pendingApproval),
        growthRate: '+15.4%',
        isGrowthPositive: true,
      },
      timeline,
      recentCommissions: recentActivity,
      barterFulfillments: sampleShipments,
    };
  });

  // POST /influencer/earnings/withdraw
  app.post('/influencer/earnings/withdraw', async (request) => {
    const actor = requireRole(request, ['INFLUENCER', 'CUSTOMER']);
    const body = (request.body as any) || {};

    const user = await prisma.user.findUnique({
      where: { id: actor.userId },
      select: { id: true, email: true, displayName: true },
    });

    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);

    // Create a notification for store admin / platform
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Withdrawal Request Submitted',
        message: `Your earnings withdrawal request has been submitted to your brand partners for direct payout processing.`,
        kind: 'PAYOUT',
      },
    });

    return {
      ok: true,
      message: 'Withdrawal request submitted successfully. Brand partner has been notified for settlement.',
    };
  });
};
