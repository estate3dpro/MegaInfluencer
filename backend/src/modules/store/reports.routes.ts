import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';

export const storeReportsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  async function organization(userId: string) {
    const org = await prisma.organization.findFirst({
      where: { ownerId: userId },
      select: { id: true, name: true, shopDomain: true },
    });
    if (!org) throw new AppError('STORE_NOT_FOUND', 'Store not found.', 404);
    return org;
  }

  // GET /store/reports/summary
  app.get('/store/reports/summary', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);

    const [orders, commissions, products, creators, customers] = await Promise.all([
      prisma.shopifyOrder.findMany({
        where: { organizationId: org.id },
        select: {
          id: true,
          name: true,
          total: true,
          creatorCode: true,
          financialStatus: true,
          processedAt: true,
          email: true,
          payload: true,
        },
        orderBy: { processedAt: 'desc' },
      }),
      prisma.affiliateCommission.findMany({
        where: { organizationId: org.id },
        select: {
          id: true,
          amount: true,
          orderAmount: true,
          status: true,
          creator: { select: { displayName: true, creatorCode: true } },
        },
      }),
      prisma.shopifyProduct.findMany({
        where: { organizationId: org.id },
        select: {
          id: true,
          title: true,
          price: true,
          inventoryTotal: true,
        },
      }),
      prisma.storeInfluencerAssignment.findMany({
        where: { organizationId: org.id },
        include: {
          influencer: {
            select: {
              id: true,
              displayName: true,
              creatorCode: true,
              instagramConnection: { select: { username: true } },
            },
          },
        },
      }),
      prisma.shopifyOrder.findMany({
        where: { organizationId: org.id, email: { not: null } },
        distinct: ['email'],
        select: { email: true },
      }),
    ]);

    const totalGMV = orders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalGMV / totalOrders : 0;

    const validCommissions = commissions.filter((c: any) => c.status !== 'REVERSED');
    const totalCommissions = validCommissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const creatorGMV = validCommissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount || 0), 0);

    const totalInventoryUnits = products.reduce((sum: number, p: any) => sum + (p.inventoryTotal || 0), 0);
    const lowStockCount = products.filter((p: any) => (p.inventoryTotal || 0) < 10).length;

    return {
      storeName: org.name,
      shopDomain: org.shopDomain,
      sales: {
        totalGMV,
        totalOrders,
        avgOrderValue,
        creatorAttributedGMV: creatorGMV,
        totalCommissions,
        attributedOrderCount: validCommissions.length,
      },
      inventory: {
        totalProducts: products.length,
        totalUnits: totalInventoryUnits,
        lowStockCount,
      },
      creators: {
        totalPartners: creators.length,
        activeCommissionsCount: validCommissions.length,
      },
      customers: {
        uniqueCustomerCount: customers.length,
      },
    };
  });
};
