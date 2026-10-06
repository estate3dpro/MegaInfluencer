import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { resolveOrderPlatform } from '../../shared/order-platform.js';

const inrCurrency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const influencerOrdersRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/influencer/orders', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const query = request.query as {
      scope?: string;
      status?: string;
      search?: string;
      platform?: string;
    };

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

    if (query.status && query.status !== 'all') {
      where.status = query.status.toUpperCase();
    }

    if (query.search) {
      where.OR = [
        { shopifyOrder: { name: { contains: query.search, mode: 'insensitive' } } },
        { shopifyOrder: { email: { contains: query.search, mode: 'insensitive' } } },
        { organization: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [rows, assignments] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        include: {
          shopifyOrder: {
            select: {
              id: true,
              name: true,
              email: true,
              total: true,
              financialStatus: true,
              fulfillmentStatus: true,
              processedAt: true,
              createdAt: true,
              payload: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          link: {
            select: {
              slug: true,
              clicks: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: { utmSource: true, utmMedium: true, utmCampaign: true },
              },
              product: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.storeInfluencerAssignment.findMany({
        where: { influencerId: actor.userId },
        select: { organizationId: true, compensationMode: true },
      }),
    ]);

    const barterOrganizations = new Set(
      assignments.filter((assignment: any) => assignment.compensationMode === 'BARTER').map((assignment: any) => assignment.organizationId),
    );
    const isBarter = (row: any) => barterOrganizations.has(row.organizationId);

    const mappedOrders = rows.map((row: any) => {
      const orderDate = row.shopifyOrder?.processedAt ?? row.shopifyOrder?.createdAt ?? row.createdAt;
      const customerEmail = row.shopifyOrder?.email;
      const customerName = customerEmail
        ? customerEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : 'Valued Customer';

      const clickUtm = row.link?.clicks?.[0] ?? null;
      const sourceInfo = resolveOrderPlatform(row.shopifyOrder?.payload, clickUtm);

      return {
        id: row.id,
        orderId: row.shopifyOrderId,
        orderNumber: row.shopifyOrder?.name ?? `#ORD-${row.id.slice(-5).toUpperCase()}`,
        customer: customerName,
        store: row.organization?.name ?? 'Store',
        storeSlug: row.organization?.slug ?? 'store',
        productTitle: row.link?.product?.title ?? 'Storewide referral',
        orderTotal: inrCurrency.format(Number(row.orderAmount)),
        orderTotalRaw: Number(row.orderAmount),
        isBarter: isBarter(row),
        commission: isBarter(row) ? null : inrCurrency.format(row.status === 'REVERSED' ? 0 : Number(row.amount)),
        commissionRaw: isBarter(row) || row.status === 'REVERSED' ? 0 : Number(row.amount),
        commissionRate: isBarter(row) ? null : `${row.commissionRate}%`,
        status: row.status === 'APPROVED' ? 'Approved' : row.status === 'PAID' ? 'Paid' : row.status === 'REVERSED' ? 'Cancelled' : 'Pending',
        statusRaw: row.status,
        platform: sourceInfo.platform,
        platformLabel: sourceInfo.platformLabel,
        utmSource: sourceInfo.utmSource,
        utmMedium: sourceInfo.utmMedium,
        utmCampaign: sourceInfo.utmCampaign,
        date: new Date(orderDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        createdAt: row.createdAt,
      };
    });

    // Optional platform filtering
    const filteredOrders = query.platform && query.platform !== 'all'
      ? mappedOrders.filter((o: any) => o.platform.toLowerCase() === query.platform?.toLowerCase() || o.utmSource?.toLowerCase() === query.platform?.toLowerCase())
      : mappedOrders;

    const totalOrders = filteredOrders.length;
    const earningRows = filteredOrders.filter((row: any) => row.status !== 'Cancelled');
    const totalSales = earningRows.reduce((sum: number, row: any) => sum + Number(row.orderTotalRaw), 0);
    const totalCommissions = earningRows
      .filter((row: any) => !row.isBarter)
      .reduce((sum: number, row: any) => sum + Number(row.commissionRaw), 0);

    return {
      metrics: {
        totalOrders,
        totalSales: inrCurrency.format(totalSales),
        totalCommissions: inrCurrency.format(totalCommissions),
        barterOrders: filteredOrders.filter((o: any) => o.isBarter).length,
        isBarterOnly: filteredOrders.length > 0 && filteredOrders.every((o: any) => o.isBarter),
        whatsappOrders: mappedOrders.filter((o: any) => o.platform === 'WHATSAPP').length,
        facebookOrders: mappedOrders.filter((o: any) => o.platform === 'FACEBOOK').length,
        instagramOrders: mappedOrders.filter((o: any) => o.platform === 'INSTAGRAM').length,
      },
      orders: filteredOrders,
    };
  });
};

