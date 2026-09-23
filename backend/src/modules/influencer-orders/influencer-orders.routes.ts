import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';

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

    const rows = await prisma.affiliateCommission.findMany({
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
            product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalOrders = rows.length;
    const earningRows = rows.filter((row: any) => row.status !== 'REVERSED');
    const totalSales = earningRows.reduce((sum: number, row: any) => sum + Number(row.orderAmount), 0);
    const totalCommissions = earningRows.reduce((sum: number, row: any) => sum + Number(row.amount), 0);

    return {
      metrics: {
        totalOrders,
        totalSales: inrCurrency.format(totalSales),
        totalCommissions: inrCurrency.format(totalCommissions),
      },
      orders: rows.map((row: any) => {
        const orderDate = row.shopifyOrder?.processedAt ?? row.shopifyOrder?.createdAt ?? row.createdAt;
        const customerEmail = row.shopifyOrder?.email;
        const customerName = customerEmail
          ? customerEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
          : 'Valued Customer';

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
          commission: inrCurrency.format(row.status === 'REVERSED' ? 0 : Number(row.amount)),
          commissionRaw: row.status === 'REVERSED' ? 0 : Number(row.amount),
          commissionRate: `${row.commissionRate}%`,
          status: row.status === 'APPROVED' ? 'Approved' : row.status === 'PAID' ? 'Paid' : row.status === 'REVERSED' ? 'Cancelled' : 'Pending',
          statusRaw: row.status,
          date: new Date(orderDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          createdAt: row.createdAt,
        };
      }),
    };
  });
};
