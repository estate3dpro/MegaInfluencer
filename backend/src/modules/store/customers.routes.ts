import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';

export const storeCustomersRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  async function storeFor(userId: string) {
    const org = await prisma.organization.findFirst({
      where: { ownerId: userId },
      select: { id: true, name: true, shopDomain: true },
    });
    if (!org) throw new AppError('STORE_NOT_FOUND', 'Store not found.', 404);
    return org;
  }

  // GET /store/customers - Only customers and orders acquired through this
  // platform. Direct Shopify customers remain stored for sync integrity but
  // are not exposed in the creator-commerce workspace.
  app.get('/store/customers', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await storeFor(actor.userId);
    const q = req.query as {
      page?: string;
      limit?: string;
      search?: string;
      filter?: 'ALL' | 'REPEAT' | 'SINGLE';
    };

    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 25));
    const search = q.search?.trim().toLowerCase();
    const filter = q.filter || 'ALL';

    const orders = await prisma.shopifyOrder.findMany({
      where: {
        organizationId: org.id,
        email: { not: null },
        creatorCode: { not: null },
      },
      orderBy: { processedAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        total: true,
        currency: true,
        processedAt: true,
        creatorCode: true,
        financialStatus: true,
        fulfillmentStatus: true,
        payload: true,
      },
    });

    const customerMap = new Map<string, any>();

    for (const order of orders) {
      if (!order.email) continue;
      const email = order.email.toLowerCase().trim();
      const raw = (order.payload as any) ?? {};
      const custRaw = raw.customer ?? {};
      const shipRaw = raw.shippingAddress ?? raw.shipping_address ?? {};

      const firstName = custRaw.firstName ?? shipRaw.firstName ?? '';
      const lastName = custRaw.lastName ?? shipRaw.lastName ?? '';
      const fullName = (firstName || lastName ? `${firstName} ${lastName}`.trim() : null) || shipRaw.name || null;
      const phone = custRaw.phone ?? shipRaw.phone ?? null;
      const city = shipRaw.city ?? null;
      const province = shipRaw.province ?? null;
      const country = shipRaw.country ?? null;

      let c = customerMap.get(email);
      if (!c) {
        c = {
          id: Buffer.from(email).toString('base64url'),
          email,
          name: fullName || email.split('@')[0],
          phone,
          location: [city, province, country].filter(Boolean).join(', ') || null,
          ordersCount: 0,
          lifetimeSpend: 0,
          currency: order.currency ?? 'INR',
          firstOrderAt: order.processedAt,
          lastOrderAt: order.processedAt,
          attributedCreatorCodes: new Set<string>(),
          recentOrders: [],
        };
      }

      c.ordersCount++;
      c.lifetimeSpend += Number(order.total || 0);

      if (order.creatorCode) {
        c.attributedCreatorCodes.add(order.creatorCode);
      }

      if (order.processedAt) {
        if (!c.firstOrderAt || new Date(order.processedAt) < new Date(c.firstOrderAt)) {
          c.firstOrderAt = order.processedAt;
        }
        if (!c.lastOrderAt || new Date(order.processedAt) > new Date(c.lastOrderAt)) {
          c.lastOrderAt = order.processedAt;
        }
      }

      if (c.recentOrders.length < 5) {
        c.recentOrders.push({
          id: order.id,
          name: order.name,
          total: order.total,
          currency: order.currency,
          processedAt: order.processedAt,
          financialStatus: order.financialStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          creatorCode: order.creatorCode,
        });
      }

      customerMap.set(email, c);
    }

    let all = [...customerMap.values()].map((c) => ({
      ...c,
      lifetimeSpend: Math.round(c.lifetimeSpend * 100) / 100,
      isRepeatBuyer: c.ordersCount > 1,
      attributedCreatorCode: c.attributedCreatorCodes.size > 0 ? [...c.attributedCreatorCodes][0] : null,
      attributedCreatorCodes: [...c.attributedCreatorCodes],
    }));

    // Calculate Summary KPIs across all unique customers
    let totalLifetimeRevenue = 0;
    let repeatCount = 0;
    let creatorAcquiredCount = 0;

    for (const c of all) {
      totalLifetimeRevenue += c.lifetimeSpend;
      if (c.isRepeatBuyer) repeatCount++;
      if (c.attributedCreatorCode) creatorAcquiredCount++;
    }

    const totalCustomers = all.length;
    const repeatCustomerRate = totalCustomers > 0 ? Math.round((repeatCount / totalCustomers) * 100) : 0;
    const averageSpend = totalCustomers > 0 ? Math.round((totalLifetimeRevenue / totalCustomers) * 100) / 100 : 0;

    // Apply Filters
    if (search) {
      all = all.filter(
        (c) =>
          c.email.toLowerCase().includes(search) ||
          c.name.toLowerCase().includes(search) ||
          (c.phone && c.phone.includes(search)) ||
          (c.location && c.location.toLowerCase().includes(search)) ||
          (c.attributedCreatorCode && c.attributedCreatorCode.toLowerCase().includes(search))
      );
    }

    if (filter === 'REPEAT') {
      all = all.filter((c) => c.isRepeatBuyer);
    } else if (filter === 'SINGLE') {
      all = all.filter((c) => c.ordersCount === 1);
    }

    // Default Sort by Lifetime Spend descending
    all.sort((a, b) => b.lifetimeSpend - a.lifetimeSpend);

    const totalFiltered = all.length;
    const paginated = all.slice((page - 1) * limit, page * limit);

    return {
      customers: paginated,
      shopDomain: org.shopDomain,
      summary: {
        totalCustomers,
        totalLifetimeRevenue: Math.round(totalLifetimeRevenue * 100) / 100,
        repeatCustomerRate,
        repeatBuyersCount: repeatCount,
        averageCustomerSpend: averageSpend,
        creatorAcquiredCustomers: creatorAcquiredCount,
      },
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.max(1, Math.ceil(totalFiltered / limit)),
      },
    };
  });

  // GET /store/customers/:customerId - Deep customer profile with complete purchase history
  app.get('/store/customers/:customerId', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await storeFor(actor.userId);
    const { customerId } = req.params as { customerId: string };

    let decodedEmail = customerId;
    try {
      if (!customerId.includes('@')) {
        decodedEmail = Buffer.from(customerId, 'base64url').toString('utf8');
      }
    } catch {
      decodedEmail = customerId;
    }

    const customerOrders = await prisma.shopifyOrder.findMany({
      where: {
        organizationId: org.id,
        email: { equals: decodedEmail, mode: 'insensitive' },
        creatorCode: { not: null },
      },
      orderBy: { processedAt: 'desc' },
      include: {
        affiliateCommissions: {
          include: {
            creator: {
              select: {
                displayName: true,
                creatorCode: true,
              },
            },
          },
        },
      },
    });

    if (customerOrders.length === 0) {
      throw new AppError('CUSTOMER_NOT_FOUND', 'Customer not found in store orders.', 404);
    }

    let lifetimeSpend = 0;
    const orderHistory: any[] = [];
    let customerInfo: any = null;
    let shippingInfo: any = null;
    const creatorCodes = new Set<string>();

    for (const order of customerOrders) {
      const total = Number(order.total || 0);
      lifetimeSpend += total;
      if (order.creatorCode) creatorCodes.add(order.creatorCode);

      const raw = (order.payload as any) ?? {};
      if (!customerInfo && raw.customer) customerInfo = raw.customer;
      if (!shippingInfo && (raw.shippingAddress || raw.shipping_address)) {
        shippingInfo = raw.shippingAddress ?? raw.shipping_address;
      }

      const lineItemsRaw = raw.lineItems?.nodes ?? raw.lineItems ?? raw.line_items ?? [];
      const lineItems = lineItemsRaw.map((item: any) => ({
        title: item.title ?? item.name ?? 'Item',
        quantity: Number(item.quantity ?? 1),
        price: item.originalUnitPriceSet?.shopMoney?.amount ?? item.price ?? '0',
      }));

      orderHistory.push({
        id: order.id,
        name: order.name,
        total: order.total,
        currency: order.currency ?? 'INR',
        financialStatus: order.financialStatus ?? 'PAID',
        fulfillmentStatus: order.fulfillmentStatus ?? 'UNFULFILLED',
        processedAt: order.processedAt,
        creatorCode: order.creatorCode,
        creatorName: order.affiliateCommissions?.[0]?.creator?.displayName ?? null,
        itemCount: lineItems.reduce((sum: number, i: any) => sum + i.quantity, 0),
        items: lineItems,
      });
    }

    const firstName = customerInfo?.firstName ?? shippingInfo?.firstName ?? '';
    const lastName = customerInfo?.lastName ?? shippingInfo?.lastName ?? '';
    const fullName = (firstName || lastName ? `${firstName} ${lastName}`.trim() : null) || shippingInfo?.name || decodedEmail.split('@')[0];

    return {
      customer: {
        id: customerId,
        email: decodedEmail,
        name: fullName,
        phone: customerInfo?.phone ?? shippingInfo?.phone ?? null,
        shippingAddress: shippingInfo,
        ordersCount: customerOrders.length,
        lifetimeSpend: Math.round(lifetimeSpend * 100) / 100,
        averageOrderValue: Math.round((lifetimeSpend / customerOrders.length) * 100) / 100,
        currency: customerOrders[0]?.currency ?? 'INR',
        firstOrderAt: customerOrders[customerOrders.length - 1]?.processedAt,
        lastOrderAt: customerOrders[0]?.processedAt,
        attributedCreatorCodes: [...creatorCodes],
        orderHistory,
      },
    };
  });
};
