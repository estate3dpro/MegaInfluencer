import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { resolveOrderPlatform } from '../../shared/order-platform.js';
import { getCreatorAttributions } from '../affiliate-links/creator-attribution.service.js';

const inrCurrency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const influencerOrdersRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/influencer/orders', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const query = request.query as { scope?: string; status?: string; search?: string; platform?: string };
    const [attributions, assignments] = await Promise.all([
      getCreatorAttributions(prisma, actor.userId, { scope: query.scope }),
      prisma.storeInfluencerAssignment.findMany({ where: { influencerId: actor.userId }, select: { organizationId: true, compensationMode: true } }),
    ]);
    const barterOrganizations = new Set(assignments.filter((assignment: any) => assignment.compensationMode === 'BARTER').map((assignment: any) => assignment.organizationId));

    const mappedOrders = attributions.map((attribution: any) => {
      const order = attribution.order ?? {};
      const customerEmail = order.email;
      const customer = customerEmail ? customerEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Valued Customer';
      const sourceInfo = resolveOrderPlatform(order.payload, null);
      const isBarter = barterOrganizations.has(attribution.organizationId);
      const status = attribution.status === 'APPROVED' ? 'Approved' : attribution.status === 'PAID' ? 'Paid' : attribution.status === 'REVERSED' ? 'Cancelled' : 'Pending';
      const rateLabel = attribution.commissionType === 'FIXED_AMOUNT' ? `₹${Number(attribution.commissionAmount).toLocaleString('en-IN')} flat` : `${attribution.commissionRate}%`;
      return {
        id: attribution.commission?.id ?? attribution.id,
        orderId: attribution.id,
        orderNumber: order.name ?? `#ORD-${String(attribution.id).slice(-5).toUpperCase()}`,
        customer,
        store: attribution.organization?.name ?? 'Store',
        storeSlug: attribution.organization?.slug ?? 'store',
        productTitle: attribution.link?.product?.title ?? 'Storewide referral',
        orderTotal: inrCurrency.format(Number(attribution.orderAmount)),
        orderTotalRaw: Number(attribution.orderAmount),
        isBarter,
        commission: isBarter ? null : inrCurrency.format(attribution.status === 'REVERSED' ? 0 : Number(attribution.commissionAmount)),
        commissionRaw: isBarter || attribution.status === 'REVERSED' ? 0 : Number(attribution.commissionAmount),
        commissionRate: isBarter ? null : rateLabel,
        commissionEstimated: attribution.isEstimated,
        status,
        statusRaw: attribution.status,
        platform: sourceInfo.platform,
        platformLabel: sourceInfo.platformLabel,
        utmSource: sourceInfo.utmSource,
        utmMedium: sourceInfo.utmMedium,
        utmCampaign: sourceInfo.utmCampaign,
        date: new Date(attribution.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdAt: attribution.createdAt,
      };
    });

    const filteredOrders = mappedOrders.filter((order: any) => {
      if (query.status && query.status !== 'all' && order.statusRaw !== query.status.toUpperCase()) return false;
      if (query.search) {
        const value = query.search.toLowerCase();
        if (![order.orderNumber, order.customer, order.store].some((field) => String(field).toLowerCase().includes(value))) return false;
      }
      return !query.platform || query.platform === 'all' || order.platform.toLowerCase() === query.platform.toLowerCase() || order.utmSource?.toLowerCase() === query.platform.toLowerCase();
    });
    const activeOrders = filteredOrders.filter((order: any) => order.status !== 'Cancelled');
    const totalSales = activeOrders.reduce((sum: number, order: any) => sum + order.orderTotalRaw, 0);
    const totalCommissions = activeOrders.filter((order: any) => !order.isBarter).reduce((sum: number, order: any) => sum + order.commissionRaw, 0);

    return {
      metrics: {
        totalOrders: filteredOrders.length,
        totalSales: inrCurrency.format(totalSales),
        totalCommissions: inrCurrency.format(totalCommissions),
        barterOrders: filteredOrders.filter((order: any) => order.isBarter).length,
        isBarterOnly: filteredOrders.length > 0 && filteredOrders.every((order: any) => order.isBarter),
        whatsappOrders: mappedOrders.filter((order: any) => order.platform === 'WHATSAPP').length,
        facebookOrders: mappedOrders.filter((order: any) => order.platform === 'FACEBOOK').length,
        instagramOrders: mappedOrders.filter((order: any) => order.platform === 'INSTAGRAM').length,
      },
      orders: filteredOrders,
    };
  });
};
