import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { getCreatorAttributions } from '../affiliate-links/creator-attribution.service.js';

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const influencerDashboardRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/influencer/dashboard', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));

    const [monthAttributions, previousAttributions, recentAttributions, monthClicks, previousClicks, assignments, creator, storeAssignments] = await Promise.all([
      getCreatorAttributions(prisma, actor.userId, { from: monthStart }),
      getCreatorAttributions(prisma, actor.userId, { from: previousMonthStart, to: monthStart }),
      getCreatorAttributions(prisma, actor.userId, { from: thirtyDaysAgo }),
      prisma.affiliateLinkClick.count({ where: { link: { creatorId: actor.userId }, createdAt: { gte: monthStart } } }),
      prisma.affiliateLinkClick.count({ where: { link: { creatorId: actor.userId }, createdAt: { gte: previousMonthStart, lt: monthStart } } }),
      prisma.campaignAssignment.findMany({ where: { influencerId: actor.userId, campaign: { status: { in: ['PUBLISHED', 'PAUSED'] }, deletedAt: null } }, include: { campaign: { include: { organization: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.user.findUnique({ where: { id: actor.userId }, select: { creatorCode: true } }),
      prisma.storeInfluencerAssignment.findMany({ where: { influencerId: actor.userId }, select: { organizationId: true, compensationMode: true } }),
    ]);

    const barterOrganizationIds = new Set(storeAssignments.filter((assignment: any) => assignment.compensationMode === 'BARTER').map((assignment: any) => assignment.organizationId));
    const isBarter = (attribution: any) => barterOrganizationIds.has(attribution.organizationId);
    const active = (attribution: any) => attribution.status !== 'REVERSED';
    const cashThisMonth = monthAttributions.filter((attribution: any) => active(attribution) && !isBarter(attribution));
    const cashPreviousMonth = previousAttributions.filter((attribution: any) => active(attribution) && !isBarter(attribution));
    const sumEarnings = (items: any[]) => items.reduce((total, item) => total + Number(item.commissionAmount), 0);
    const sumSales = (items: any[]) => items.reduce((total, item) => total + Number(item.orderAmount), 0);
    const change = (current: number, previous: number) => previous ? ((current - previous) / previous) * 100 : current ? 100 : 0;

    const daily = new Map<string, number>();
    for (let offset = 0; offset < 30; offset += 1) {
      const day = new Date(thirtyDaysAgo); day.setDate(thirtyDaysAgo.getDate() + offset);
      daily.set(day.toISOString().slice(0, 10), 0);
    }
    for (const attribution of recentAttributions.filter((item: any) => active(item) && !isBarter(item))) {
      const key = new Date(attribution.createdAt).toISOString().slice(0, 10);
      daily.set(key, (daily.get(key) ?? 0) + Number(attribution.commissionAmount));
    }

    return {
      creatorCode: creator?.creatorCode ?? null,
      metrics: {
        earnings: sumEarnings(cashThisMonth),
        sales: sumSales(monthAttributions.filter(active)),
        orders: monthAttributions.filter(active).length,
        clicks: monthClicks,
        earningsChange: change(sumEarnings(cashThisMonth), sumEarnings(cashPreviousMonth)),
        clicksChange: change(monthClicks, previousClicks),
      },
      earnings: [...daily.entries()].map(([date, amount]) => ({ date, amount })),
      campaigns: assignments.map(({ campaign, status }: any) => ({ id: campaign.id, title: campaign.title, brand: campaign.organization.name, status, deadline: campaign.contentDeadline ?? campaign.applicationDeadline, campaignStatus: campaign.status })),
      isBarterOnly: storeAssignments.length > 0 && storeAssignments.every((assignment: any) => assignment.compensationMode === 'BARTER'),
      activity: recentAttributions.slice(0, 5).map((attribution: any) => ({
        id: `${attribution.order?.name ?? attribution.id}-${new Date(attribution.createdAt).toISOString()}`,
        title: attribution.status === 'REVERSED' ? 'Commission reversed' : attribution.status === 'APPROVED' ? 'Commission approved' : attribution.isEstimated ? 'Commission pending sync' : 'Commission recorded',
        detail: `${attribution.organization?.name ?? 'Brand Store'} · Order ${attribution.order?.name ?? attribution.id}`,
        amount: attribution.status === 'REVERSED' ? 0 : Number(attribution.commissionAmount),
        createdAt: attribution.createdAt,
      })),
    };
  });
};
