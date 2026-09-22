import { Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { decryptToken } from '../instagram/instagram.crypto.js';

type Node = Record<string, any>;
type Page = { items?: Node[]; pageInfo?: { hasNextPage: boolean; endCursor: string | null }; error?: string };

const query = `query Orders($after:String){orders(first:100,after:$after,sortKey:PROCESSED_AT,reverse:true){nodes{id name email phone note tags customAttributes{key value} displayFinancialStatus displayFulfillmentStatus processedAt createdAt totalPriceSet{shopMoney{amount currencyCode}} totalShippingPriceSet{shopMoney{amount currencyCode}} totalTaxSet{shopMoney{amount currencyCode}} lineItems(first:250){nodes{title quantity sku originalUnitPriceSet{shopMoney{amount currencyCode}} variant{title image{url}} image{url}}} shippingAddress{firstName lastName name address1 address2 city province zip country phone} customer{firstName lastName email phone} } pageInfo{hasNextPage endCursor}}}`;

async function storeFor(app: Parameters<FastifyPluginAsync>[0], userId: string) {
  const s = await app.prisma.organization.findFirst({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      platform: true,
      connectionStatus: true,
      shopDomain: true,
      appUrl: true,
      shopifyConnectionMethod: true,
      encryptedShopifyAccessToken: true,
    },
  });
  if (!s || s.platform !== 'SHOPIFY') {
    throw new AppError('SHOPIFY_STORE_NOT_FOUND', 'No Shopify store is connected to this account.', 404);
  }
  if (
    s.connectionStatus !== 'CONNECTED' ||
    !s.shopDomain ||
    !s.encryptedShopifyAccessToken ||
    (s.shopifyConnectionMethod === 'CLI_APP' && !s.appUrl)
  ) {
    throw new AppError('SHOPIFY_NOT_CONNECTED', 'Complete the Shopify connection before syncing orders.', 409);
  }
  return s;
}

async function fetchOrderPage(store: Awaited<ReturnType<typeof storeFor>>, after: string | null) {
  const shop = store.shopDomain!.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const token = decryptToken(store.encryptedShopifyAccessToken!);
  try {
    if (store.shopifyConnectionMethod === 'CLI_APP') {
      const u = new URL(`${store.appUrl!.replace(/\/$/, '')}/app/api/bridge/orders`);
      u.searchParams.set('shop', shop);
      u.searchParams.set('first', '100');
      if (after) u.searchParams.set('after', after);
      const r = await fetch(u, { headers: { 'X-MegaChat-Bridge-Token': token } });
      const b = (await r.json().catch(() => null)) as Page | null;
      if (!r.ok || !b?.items || !b.pageInfo) {
        throw new AppError('SHOPIFY_ORDERS_UNAVAILABLE', b?.error ?? 'Shopify bridge could not return orders.', 502);
      }
      return b as Required<Page>;
    }
    const r = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query, variables: { after } }),
    });
    const b = (await r.json().catch(() => null)) as any;
    const o = b?.data?.orders;
    if (!r.ok || b?.errors?.length || !o?.nodes) {
      throw new AppError('SHOPIFY_ORDERS_UNAVAILABLE', b?.errors?.[0]?.message ?? 'Shopify could not return orders.', 502);
    }
    return { items: o.nodes, pageInfo: o.pageInfo };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError('SHOPIFY_UNAVAILABLE', 'Unable to reach the connected Shopify store.', 502);
  }
}

export const storeOrdersRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  // GET /store/orders - Paginated order list with search, status filters & creator attribution
  app.get('/store/orders', async (req) => {
    const a = requireRole(req, ['STORE_OWNER']);
    const s = await storeFor(app, a.userId);
    const q = req.query as {
      page?: string;
      limit?: string;
      search?: string;
      financialStatus?: string;
      fulfillmentStatus?: string;
      creatorOnly?: string;
    };

    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 25));
    const search = q.search?.trim();

    const where: Prisma.ShopifyOrderWhereInput = {
      organizationId: s.id,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { creatorCode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(q.financialStatus && q.financialStatus !== 'ALL'
        ? { financialStatus: { equals: q.financialStatus, mode: 'insensitive' } }
        : {}),
      ...(q.fulfillmentStatus && q.fulfillmentStatus !== 'ALL'
        ? q.fulfillmentStatus === 'UNFULFILLED'
          ? {
              OR: [
                { fulfillmentStatus: null },
                { fulfillmentStatus: { in: ['UNFULFILLED', 'unfulfilled', 'null', ''] } },
              ],
            }
          : { fulfillmentStatus: { in: ['FULFILLED', 'fulfilled'] } }
        : {}),
      ...(q.creatorOnly === 'true' ? { creatorCode: { not: null } } : {}),
    };

    const [rows, total, allOrdersSummary] = await Promise.all([
      prisma.shopifyOrder.findMany({
        where,
        orderBy: { processedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          affiliateCommissions: {
            include: {
              creator: {
                select: {
                  id: true,
                  displayName: true,
                  creatorCode: true,
                  instagramConnection: { select: { username: true } },
                },
              },
              link: {
                select: {
                  slug: true,
                  commissionRate: true,
                },
              },
            },
          },
        },
      }),
      prisma.shopifyOrder.count({ where }),
      prisma.shopifyOrder.findMany({
        where: { organizationId: s.id },
        select: {
          total: true,
          financialStatus: true,
          fulfillmentStatus: true,
          creatorCode: true,
        },
      }),
    ]);

    // Calculate store-wide order summary metrics
    let totalSales = 0;
    let paidOrdersCount = 0;
    let unfulfilledCount = 0;
    let creatorOrdersCount = 0;
    let creatorSales = 0;

    for (const order of allOrdersSummary) {
      const amount = Number(order.total || 0);
      totalSales += amount;
      if (/paid/i.test(order.financialStatus ?? '')) paidOrdersCount++;
      if (!order.fulfillmentStatus || /processing|unfulfilled/i.test(order.fulfillmentStatus)) unfulfilledCount++;
      if (order.creatorCode) {
        creatorOrdersCount++;
        creatorSales += amount;
      }
    }

    const formattedOrders = rows.map((order: any) => {
      const commission = order.affiliateCommissions?.[0];
      const creator = commission?.creator;
      const igHandle = creator?.instagramConnection?.username
        ? `@${creator.instagramConnection.username}`
        : order.creatorCode
        ? `@${order.creatorCode}`
        : null;

      return {
        id: order.id,
        shopifyId: order.shopifyId,
        name: order.name,
        email: order.email,
        currency: order.currency ?? 'INR',
        total: order.total ?? '0',
        financialStatus: order.financialStatus ?? 'PAID',
        fulfillmentStatus: order.fulfillmentStatus ?? 'UNFULFILLED',
        processedAt: order.processedAt,
        creatorCode: order.creatorCode,
        creator: creator
          ? {
              id: creator.id,
              name: creator.displayName,
              handle: igHandle,
              code: creator.creatorCode ?? order.creatorCode,
            }
          : null,
        commission: commission
          ? {
              id: commission.id,
              amount: Number(commission.amount),
              rate: Number(commission.commissionRate),
              status: commission.status,
              linkSlug: commission.link?.slug,
            }
          : null,
      };
    });

    return {
      orders: formattedOrders,
      shopDomain: s.shopDomain,
      summary: {
        totalOrders: allOrdersSummary.length,
        totalSales: Math.round(totalSales * 100) / 100,
        paidOrdersCount,
        unfulfilledCount,
        creatorOrdersCount,
        creatorSales: Math.round(creatorSales * 100) / 100,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  });

  // POST /store/orders/sync - Sync latest orders from Shopify & auto-track affiliate commissions
  app.post('/store/orders/sync', async (req) => {
    const a = requireRole(req, ['STORE_OWNER']);
    const s = await storeFor(app, a.userId);
    let after: string | null = null;
    let synced = 0;

    do {
      const p = await fetchOrderPage(s, after);
      await Promise.all(
        p.items.map(async (item: Node) => {
          const raw = item.raw ?? item;
          const total = raw.totalPriceSet?.shopMoney;
          const attributes = raw.customAttributes ?? item.customAttributes ?? [];
          const trackedCreatorCode =
            attributes.find(
              (attribute: Node) =>
                (attribute.key ?? attribute.name) === 'mi_creator_code' ||
                (attribute.key ?? attribute.name) === 'utm_creator_code'
            )?.value ?? null;

          const d = {
            shopifyId: item.shopifyGid ?? raw.id,
            name: item.name ?? raw.name,
            email: item.customerEmail ?? raw.email ?? raw.customer?.email ?? null,
            currency: item.currencyCode ?? total?.currencyCode ?? null,
            total: item.totalAmount ?? total?.amount ?? null,
            financialStatus: item.financialStatus ?? raw.displayFinancialStatus ?? null,
            fulfillmentStatus: raw.displayFulfillmentStatus ?? null,
            processedAt: item.shopifyCreatedAt ?? raw.processedAt ? new Date(item.shopifyCreatedAt ?? raw.processedAt) : null,
            creatorCode: trackedCreatorCode,
            payload: raw as Prisma.InputJsonValue,
          };

          const order = await prisma.shopifyOrder.upsert({
            where: { organizationId_shopifyId: { organizationId: s.id, shopifyId: d.shopifyId } },
            create: { organizationId: s.id, ...d },
            update: d,
          });

          const linkSlug = attributes.find(
            (attribute: Node) => (attribute.key ?? attribute.name) === 'mi_link'
          )?.value;
          const tags = raw.tags ?? item.tags ?? [];

          if (!linkSlug || tags.includes('InfluencerSample')) return;

          const link = await prisma.affiliateLink.findFirst({
            where: { organizationId: s.id, slug: String(linkSlug) },
            select: {
              id: true,
              creatorId: true,
              commissionRate: true,
              creator: { select: { creatorCode: true } },
            },
          });

          if (!link) return;

          const creatorCode = link.creator?.creatorCode ?? trackedCreatorCode;
          if (creatorCode !== trackedCreatorCode) {
            await prisma.shopifyOrder.update({
              where: { id: order.id },
              data: { creatorCode },
            });
          }

          const amount = Number(d.total ?? 0);
          const isRefunded = d.financialStatus === 'REFUNDED' || d.financialStatus === 'refunded';
          const status = isRefunded ? 'REVERSED' : 'PENDING';

          await prisma.affiliateCommission.upsert({
            where: { shopifyOrderId: order.id },
            create: {
              organizationId: s.id,
              linkId: link.id,
              creatorId: link.creatorId,
              shopifyOrderId: order.id,
              orderAmount: amount,
              commissionRate: link.commissionRate,
              amount: (amount * Number(link.commissionRate)) / 100,
              status,
            },
            update: { status: isRefunded ? 'REVERSED' : undefined },
          });
        })
      );
      synced += p.items.length;
      after = p.pageInfo.hasNextPage ? p.pageInfo.endCursor : null;
    } while (after);

    return { synced };
  });

  // GET /store/orders/:orderId - Deep details for order
  app.get('/store/orders/:orderId', async (req) => {
    const a = requireRole(req, ['STORE_OWNER']);
    const s = await storeFor(app, a.userId);
    const { orderId } = req.params as { orderId: string };

    const order = await prisma.shopifyOrder.findFirst({
      where: { id: orderId, organizationId: s.id },
      include: {
        affiliateCommissions: {
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
                creatorCode: true,
                email: true,
                instagramConnection: { select: { username: true, displayName: true } },
              },
            },
            link: {
              select: {
                id: true,
                slug: true,
                commissionRate: true,
                targetType: true,
                destinationPath: true,
              },
            },
          },
        },
      },
    });

    if (!order) throw new AppError('ORDER_NOT_FOUND', 'Order not found.', 404);

    const raw = (order.payload as any) ?? {};
    const lineItemsRaw = raw.lineItems?.nodes ?? raw.lineItems ?? raw.line_items ?? [];

    const lineItems = lineItemsRaw.map((item: any) => {
      const unitPrice =
        item.originalUnitPriceSet?.shopMoney?.amount ?? item.price ?? item.unit_price ?? '0';
      const currency =
        item.originalUnitPriceSet?.shopMoney?.currencyCode ?? order.currency ?? 'INR';
      const quantity = Number(item.quantity ?? item.qty ?? 1);
      const imageUrl = item.image?.url ?? item.variant?.image?.url ?? null;

      return {
        id: item.id ?? item.variant_id ?? item.title,
        title: item.title ?? item.name ?? 'Item',
        variantTitle: item.variant?.title ?? item.variant_title ?? null,
        sku: item.sku ?? null,
        quantity,
        price: unitPrice,
        currency,
        total: Math.round(Number(unitPrice) * quantity * 100) / 100,
        imageUrl,
      };
    });

    const customAttributes = raw.customAttributes ?? [];
    const utmSource = customAttributes.find((a: any) => (a.key ?? a.name) === 'utm_source')?.value ?? null;
    const utmMedium = customAttributes.find((a: any) => (a.key ?? a.name) === 'utm_medium')?.value ?? null;
    const utmCampaign = customAttributes.find((a: any) => (a.key ?? a.name) === 'utm_campaign')?.value ?? null;
    const linkSlug = customAttributes.find((a: any) => (a.key ?? a.name) === 'mi_link')?.value ?? null;

    const commission = order.affiliateCommissions?.[0] ?? null;

    return {
      order: {
        id: order.id,
        shopifyId: order.shopifyId,
        name: order.name,
        email: order.email,
        currency: order.currency ?? 'INR',
        total: order.total ?? '0',
        financialStatus: order.financialStatus ?? 'PAID',
        fulfillmentStatus: order.fulfillmentStatus ?? 'UNFULFILLED',
        processedAt: order.processedAt,
        creatorCode: order.creatorCode,
        shopDomain: s.shopDomain,
        shippingAddress: raw.shippingAddress ?? raw.shipping_address ?? null,
        customer: raw.customer ?? { email: order.email },
        lineItems,
        attribution: {
          creatorCode: order.creatorCode,
          linkSlug,
          utmSource,
          utmMedium,
          utmCampaign,
          customAttributes,
        },
        commission: commission
          ? {
              id: commission.id,
              amount: Number(commission.amount),
              rate: Number(commission.commissionRate),
              status: commission.status,
              createdAt: commission.createdAt,
              creator: commission.creator
                ? {
                    id: commission.creator.id,
                    name: commission.creator.displayName,
                    email: commission.creator.email,
                    creatorCode: commission.creator.creatorCode,
                    handle: commission.creator.instagramConnection?.username
                      ? `@${commission.creator.instagramConnection.username}`
                      : `@${commission.creator.creatorCode || 'creator'}`,
                  }
                : null,
              link: commission.link,
            }
          : null,
      },
    };
  });

  // POST /store/orders/:orderId/commission/status - Update commission approval/payout status
  const updateCommissionStatusSchema = z.object({
    status: z.enum(['PENDING', 'APPROVED', 'PAID', 'REVERSED']),
  });

  app.post('/store/orders/:orderId/commission/status', async (req) => {
    const a = requireRole(req, ['STORE_OWNER']);
    const s = await storeFor(app, a.userId);
    const { orderId } = req.params as { orderId: string };
    const { status } = updateCommissionStatusSchema.parse(req.body);

    const commission = await prisma.affiliateCommission.findFirst({
      where: { shopifyOrderId: orderId, organizationId: s.id },
    });

    if (!commission) {
      throw new AppError('COMMISSION_NOT_FOUND', 'No affiliate commission record found for this order.', 404);
    }

    const updated = await prisma.affiliateCommission.update({
      where: { id: commission.id },
      data: { status },
    });

    return { ok: true, commission: updated };
  });
};
