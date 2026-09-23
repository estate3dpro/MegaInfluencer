import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const influencerDashboardRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;
  app.get('/influencer/dashboard', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));
    const activeCommission = { creatorId: actor.userId, status: { not: 'REVERSED' as const } };

    const [monthCommissions, previousCommissions, monthOrderCount, recentCommissions, monthClicks, previousClicks, assignments, creator] = await Promise.all([
      prisma.affiliateCommission.findMany({ where: { ...activeCommission, createdAt: { gte: monthStart } }, select: { amount: true, orderAmount: true, createdAt: true } }),
      prisma.affiliateCommission.findMany({ where: { ...activeCommission, createdAt: { gte: previousMonthStart, lt: monthStart } }, select: { amount: true, orderAmount: true } }),
      prisma.affiliateCommission.count({ where: { creatorId: actor.userId, createdAt: { gte: monthStart } } }),
      prisma.affiliateCommission.findMany({ where: { creatorId: actor.userId, createdAt: { gte: thirtyDaysAgo } }, select: { amount: true, createdAt: true, status: true, shopifyOrder: { select: { name: true } }, organization: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.affiliateLinkClick.count({ where: { link: { creatorId: actor.userId }, createdAt: { gte: monthStart } } }),
      prisma.affiliateLinkClick.count({ where: { link: { creatorId: actor.userId }, createdAt: { gte: previousMonthStart, lt: monthStart } } }),
      prisma.campaignAssignment.findMany({ where: { influencerId: actor.userId, campaign: { status: { in: ['PUBLISHED', 'PAUSED'] }, deletedAt: null } }, include: { campaign: { include: { organization: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.user.findUnique({ where: { id: actor.userId }, select: { creatorCode: true } }),
    ]);

    const sum = (items: Array<{ amount: unknown }>) => items.reduce((total, item) => total + Number(item.amount), 0);
    const sales = (items: Array<{ orderAmount: unknown }>) => items.reduce((total, item) => total + Number(item.orderAmount), 0);
    const change = (current: number, previous: number) => previous ? ((current - previous) / previous) * 100 : current ? 100 : 0;
    const daily = new Map<string, number>();
    for (let offset = 0; offset < 30; offset += 1) {
      const day = new Date(thirtyDaysAgo); day.setDate(thirtyDaysAgo.getDate() + offset);
      daily.set(day.toISOString().slice(0, 10), 0);
    }
    for (const commission of recentCommissions) {
      const key = commission.createdAt.toISOString().slice(0, 10);
      daily.set(key, (daily.get(key) ?? 0) + Number(commission.amount));
    }

    return {
      creatorCode: creator?.creatorCode ?? null,
      metrics: {
        earnings: sum(monthCommissions), sales: sales(monthCommissions), orders: monthOrderCount, clicks: monthClicks,
        earningsChange: change(sum(monthCommissions), sum(previousCommissions)), clicksChange: change(monthClicks, previousClicks),
      },
      earnings: [...daily.entries()].map(([date, amount]) => ({ date, amount })),
      campaigns: assignments.map(({ campaign, status }: any) => ({ id: campaign.id, title: campaign.title, brand: campaign.organization.name, status, deadline: campaign.contentDeadline ?? campaign.applicationDeadline, campaignStatus: campaign.status })),
      activity: recentCommissions.map((commission: any) => ({ id: `${commission.shopifyOrder.name}-${commission.createdAt.toISOString()}`, title: commission.status === 'REVERSED' ? 'Commission reversed' : commission.status === 'APPROVED' ? 'Commission approved' : 'Commission recorded', detail: `${commission.organization.name} · Order ${commission.shopifyOrder.name}`, amount: commission.status === 'REVERSED' ? 0 : Number(commission.amount), createdAt: commission.createdAt })),
    };
  });
};
