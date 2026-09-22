import { Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { config } from '../../config/env.js';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ensureCreatorCode } from '../../shared/creator-code.js';
import { decryptToken } from '../instagram/instagram.crypto.js';
import { ensureProductAssignmentsTable } from '../product-assignments/product-assignments.service.js';

type Node = Record<string, any>;
type Page = { items?: Node[]; pageInfo?: { hasNextPage: boolean; endCursor: string | null }; error?: string };
type SyncJob = {
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  synced: number;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
};

// Product data is persisted page-by-page; job progress only needs to live for this API process.
const productSyncJobs = new Map<string, SyncJob>();
const query = `query Products($after: String) { products(first: 100, after: $after, sortKey: UPDATED_AT, reverse: true) { nodes { id title handle status vendor productType descriptionHtml totalInventory featuredImage { id url altText width height } images(first: 250) { nodes { id url altText width height } } priceRangeV2 { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } variants(first: 250) { nodes { id title sku price inventoryQuantity selectedOptions { name value } image { id url altText } inventoryItem { id tracked } } } } pageInfo { hasNextPage endCursor } } }`;

async function storeFor(app: Parameters<FastifyPluginAsync>[0], userId: string) {
  const store = await app.prisma.organization.findFirst({
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
  if (!store || store.platform !== 'SHOPIFY') {
    throw new AppError('SHOPIFY_STORE_NOT_FOUND', 'No Shopify store is connected to this account.', 404);
  }
  if (
    store.connectionStatus !== 'CONNECTED' ||
    !store.shopDomain ||
    !store.encryptedShopifyAccessToken ||
    (store.shopifyConnectionMethod === 'CLI_APP' && !store.appUrl)
  ) {
    throw new AppError('SHOPIFY_NOT_CONNECTED', 'Complete the Shopify connection before syncing products.', 409);
  }
  return store;
}

async function fetchPage(store: Awaited<ReturnType<typeof storeFor>>, after: string | null) {
  const shop = store.shopDomain!.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const token = decryptToken(store.encryptedShopifyAccessToken!);
  try {
    if (store.shopifyConnectionMethod === 'CLI_APP') {
      const url = new URL(`${store.appUrl!.replace(/\/$/, '')}/app/api/bridge/products`);
      url.searchParams.set('shop', shop);
      url.searchParams.set('first', '100');
      if (after) url.searchParams.set('after', after);
      const response = await fetch(url, { headers: { 'X-MegaChat-Bridge-Token': token } });
      const body = (await response.json().catch(() => null)) as Page | null;
      if (!response.ok || !body?.items || !body.pageInfo) {
        throw new AppError('SHOPIFY_PRODUCTS_UNAVAILABLE', body?.error ?? 'Shopify bridge could not return products.', 502);
      }
      return body as Required<Page>;
    }
    const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query, variables: { after } }),
    });
    const body = (await response.json().catch(() => null)) as any;
    const products = body?.data?.products;
    if (!response.ok || body?.errors?.length || !products?.nodes || !products.pageInfo) {
      throw new AppError('SHOPIFY_PRODUCTS_UNAVAILABLE', body?.errors?.[0]?.message ?? 'Shopify could not return products.', 502);
    }
    return { items: products.nodes, pageInfo: products.pageInfo };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('SHOPIFY_UNAVAILABLE', 'Unable to reach the connected Shopify store.', 502);
  }
}

function data(item: Node) {
  const raw = item.raw ?? item;
  const price = raw.priceRangeV2?.minVariantPrice ?? raw.variants?.nodes?.[0];
  const inventoryTotal =
    raw.totalInventory ??
    raw.variants?.nodes?.reduce((total: number, variant: Node) => total + (Number(variant.inventoryQuantity) || 0), 0) ??
    0;
  return {
    shopifyId: item.shopifyGid ?? raw.id,
    title: item.title ?? raw.title,
    handle: item.handle ?? raw.handle ?? null,
    status: item.status ?? raw.status ?? null,
    vendor: item.vendor ?? raw.vendor ?? null,
    productType: item.productType ?? raw.productType ?? null,
    descriptionHtml: raw.descriptionHtml ?? item.bodyHtml ?? null,
    imageUrl: raw.featuredImage?.url ?? item.imageUrl ?? item.images?.[0]?.url ?? null,
    inventoryTotal,
    price: price?.amount ?? price?.price ?? null,
    currency: item.currencyCode ?? price?.currencyCode ?? null,
    payload: raw as Prisma.InputJsonValue,
  };
}

function productSummary(product: {
  id: string;
  title: string;
  handle: string | null;
  imageUrl: string | null;
  inventoryTotal: number;
  price: string | null;
  currency: string | null;
  vendor: string | null;
  productType: string | null;
  status: string | null;
  payload: Prisma.JsonValue;
}) {
  const fallback = data({ raw: product.payload as Node });
  const hasFallbackPrice = fallback.price !== null && fallback.price !== undefined;
  return {
    id: product.id,
    name: product.title,
    sku: product.handle ?? '—',
    handle: product.handle ?? '',
    imageUrl: product.imageUrl ?? fallback.imageUrl,
    stock: product.inventoryTotal || fallback.inventoryTotal,
    price:
      product.price && Number(product.price) > 0
        ? product.price
        : hasFallbackPrice
        ? String(fallback.price)
        : product.price ?? '0',
    currency: product.currency ?? fallback.currency ?? 'INR',
    vendor: product.vendor ?? fallback.vendor ?? null,
    productType: product.productType ?? fallback.productType ?? null,
    status: product.status ?? fallback.status ?? 'ACTIVE',
  };
}

function generateSlug() {
  return randomBytes(9).toString('base64url');
}

async function runSync(app: Parameters<FastifyPluginAsync>[0], store: Awaited<ReturnType<typeof storeFor>>) {
  const job: SyncJob = { status: 'RUNNING', synced: 0, startedAt: new Date().toISOString(), completedAt: null, error: null };
  productSyncJobs.set(store.id, job);
  try {
    let after: string | null = null;
    do {
      const page = await fetchPage(store, after);
      await Promise.all(
        page.items.map((item: Node) => {
          const product = data(item);
          return app.prisma.shopifyProduct.upsert({
            where: { organizationId_shopifyId: { organizationId: store.id, shopifyId: product.shopifyId } },
            create: { organizationId: store.id, ...product },
            update: product,
          });
        })
      );
      job.synced += page.items.length;
      after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    } while (after);
    job.status = 'COMPLETED';
  } catch (error) {
    job.status = 'FAILED';
    job.error = error instanceof Error ? error.message : 'Product sync failed.';
    app.log.error(error, 'Shopify product background sync failed');
  } finally {
    job.completedAt = new Date().toISOString();
  }
}

export const storeProductsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  // GET /store/products - List products with sales metrics & creator stats
  app.get('/store/products', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']);
    const store = await storeFor(app, actor.userId);
    const requestQuery = request.query as { page?: string; limit?: string; search?: string; all?: string; stock?: string };
    const page = Math.max(1, Number(requestQuery.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(requestQuery.limit) || 25));
    const search = requestQuery.search?.trim();
    const all = requestQuery.all === 'true';

    const where: Prisma.ShopifyProductWhereInput = {
      organizationId: store.id,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { handle: { contains: search, mode: 'insensitive' } },
              { vendor: { contains: search, mode: 'insensitive' } },
              { productType: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total, allOrders, affiliateLinks, assignments] = await Promise.all([
      prisma.shopifyProduct.findMany({
        where,
        orderBy: { title: 'asc' },
        ...(all ? {} : { skip: (page - 1) * limit, take: limit }),
        include: {
          _count: {
            select: {
              affiliateLinks: true,
              productAssignments: true,
            },
          },
        },
      }),
      prisma.shopifyProduct.count({ where }),
      prisma.shopifyOrder.findMany({
        where: { organizationId: store.id },
        select: {
          id: true,
          total: true,
          creatorCode: true,
          payload: true,
        },
      }),
      prisma.affiliateLink.findMany({
        where: { organizationId: store.id, productId: { not: null } },
        select: {
          id: true,
          productId: true,
          commissions: {
            where: { status: { not: 'REVERSED' } },
            select: { orderAmount: true, amount: true },
          },
        },
      }),
      prisma.productInfluencerAssignment.findMany({
        where: { organizationId: store.id },
        select: { productId: true, influencerId: true },
      }),
    ]);

    // Build lookup for affiliate link performance by product
    const productAffiliateStats = new Map<string, { creatorSales: number; creatorOrders: number }>();
    for (const link of affiliateLinks) {
      if (!link.productId) continue;
      const current = productAffiliateStats.get(link.productId) || { creatorSales: 0, creatorOrders: 0 };
      const commissions = link.commissions ?? [];
      current.creatorOrders += commissions.length;
      current.creatorSales += commissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount || 0), 0);
      productAffiliateStats.set(link.productId, current);
    }

    // Build lookup for creator assignments
    const productAssignmentCounts = new Map<string, number>();
    for (const a of assignments) {
      productAssignmentCounts.set(a.productId, (productAssignmentCounts.get(a.productId) || 0) + 1);
    }

    // Compute sales & units for each product from order line items
    const productOrderStats = new Map<string, { sales: number; orders: number; units: number }>();
    for (const order of allOrders) {
      const payload = order.payload as any;
      const lineItems = payload?.lineItems?.nodes || payload?.line_items || [];
      const orderTotal = Number(order.total || 0);

      for (const item of lineItems) {
        const itemTitle = (item.title || item.name || '').toLowerCase().trim();
        const itemSku = (item.sku || '').toLowerCase().trim();
        const qty = Number(item.quantity || 1);
        const itemPrice = Number(item.originalUnitPriceSet?.shopMoney?.amount || item.price || 0);
        const lineItemSales = itemPrice > 0 ? itemPrice * qty : orderTotal;

        // Match with products
        for (const p of rows) {
          const pTitle = (p.title || '').toLowerCase().trim();
          const pHandle = (p.handle || '').toLowerCase().trim();
          if (
            (pTitle && itemTitle && (itemTitle.includes(pTitle) || pTitle.includes(itemTitle))) ||
            (pHandle && itemSku && (itemSku.includes(pHandle) || pHandle.includes(itemSku)))
          ) {
            const cur = productOrderStats.get(p.id) || { sales: 0, orders: 0, units: 0 };
            cur.sales += lineItemSales;
            cur.orders += 1;
            cur.units += qty;
            productOrderStats.set(p.id, cur);
          }
        }
      }
    }

    const products = rows.map((row: any) => {
      const summary = productSummary(row);
      const orderStat = productOrderStats.get(row.id) || { sales: 0, orders: 0, units: 0 };
      const affStat = productAffiliateStats.get(row.id) || { creatorSales: 0, creatorOrders: 0 };
      const assignedCount = productAssignmentCounts.get(row.id) || row._count?.productAssignments || 0;
      const linksCount = row._count?.affiliateLinks || 0;

      // GMV is maximum of detected line-item sales or direct affiliate sales
      const totalSales = Math.max(orderStat.sales, affStat.creatorSales);
      const totalOrders = Math.max(orderStat.orders, affStat.creatorOrders);

      return {
        ...summary,
        salesTotal: Math.round(totalSales * 100) / 100,
        ordersCount: totalOrders,
        unitsSold: orderStat.units,
        creatorSales: Math.round(affStat.creatorSales * 100) / 100,
        creatorOrders: affStat.creatorOrders,
        assignedCreatorsCount: assignedCount,
        activeLinksCount: linksCount,
        shopifyId: row.shopifyId,
      };
    });

    // Compute catalog summary KPIs
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalCatalogValue = 0;
    let totalProductsSales = 0;

    for (const p of products) {
      if (p.stock === 0) outOfStockCount++;
      else if (p.stock < 10) lowStockCount++;
      else inStockCount++;
      totalCatalogValue += Number(p.price || 0) * (p.stock || 0);
      totalProductsSales += p.salesTotal;
    }

    return {
      products,
      shopDomain: store.shopDomain,
      summary: {
        totalProducts: total,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        totalCatalogValue: Math.round(totalCatalogValue * 100) / 100,
        totalSales: Math.round(totalProductsSales * 100) / 100,
      },
      pagination: {
        page,
        limit: all ? total : limit,
        total,
        totalPages: all ? 1 : Math.max(1, Math.ceil(total / limit)),
      },
    };
  });

  // GET /store/products/sync/status
  app.get('/store/products/sync/status', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']);
    const store = await storeFor(app, actor.userId);
    return {
      sync:
        productSyncJobs.get(store.id) ??
        ({ status: 'IDLE', synced: 0, startedAt: null, completedAt: null, error: null } satisfies SyncJob),
    };
  });

  // POST /store/products/sync
  app.post('/store/products/sync', async (request, reply) => {
    const actor = requireRole(request, ['STORE_OWNER']);
    const store = await storeFor(app, actor.userId);
    const existing = productSyncJobs.get(store.id);
    if (existing?.status === 'RUNNING') {
      return reply.status(202).send({ sync: existing, alreadyRunning: true });
    }
    void runSync(app, store);
    const sync = productSyncJobs.get(store.id)!;
    return reply.status(202).send({ sync, alreadyRunning: false });
  });

  // GET /store/products/:productId - Deep details for product
  app.get('/store/products/:productId', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']);
    const store = await storeFor(app, actor.userId);
    const { productId } = request.params as { productId: string };

    await ensureProductAssignmentsTable(prisma);

    const product = await prisma.shopifyProduct.findFirst({
      where: { id: productId, organizationId: store.id },
      include: {
        affiliateLinks: {
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
                creatorCode: true,
                email: true,
                instagramConnection: { select: { username: true } },
              },
            },
            _count: { select: { clicks: true } },
            commissions: {
              where: { status: { not: 'REVERSED' } },
              select: { orderAmount: true, amount: true, status: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', 'Product not found.', 404);
    }

    // Get assigned influencers
    const assignedRows = await prisma.productInfluencerAssignment.findMany({
      where: { productId, organizationId: store.id },
      include: {
        influencer: {
          select: {
            id: true,
            displayName: true,
            creatorCode: true,
            email: true,
            createdAt: true,
            instagramConnection: { select: { username: true, displayName: true, status: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get all store creators to list available for assignment
    const allStoreCreators = await prisma.storeInfluencerAssignment.findMany({
      where: { organizationId: store.id },
      include: {
        influencer: {
          select: {
            id: true,
            displayName: true,
            creatorCode: true,
            email: true,
            instagramConnection: { select: { username: true } },
          },
        },
      },
    });

    const assignedCreatorIds = new Set(assignedRows.map((r: any) => r.influencerId));
    const availableCreators = allStoreCreators
      .filter((sc: any) => !assignedCreatorIds.has(sc.influencer.id))
      .map((sc: any) => ({
        id: sc.influencer.id,
        displayName: sc.influencer.displayName,
        creatorCode: sc.influencer.creatorCode,
        email: sc.influencer.email,
        instagramUsername: sc.influencer.instagramConnection?.username ?? null,
      }));

    // Find all store orders that purchased this product
    const allOrders = await prisma.shopifyOrder.findMany({
      where: { organizationId: store.id },
      orderBy: { processedAt: 'desc' },
      take: 100,
    });

    const pTitle = (product.title || '').toLowerCase().trim();
    const pHandle = (product.handle || '').toLowerCase().trim();

    let totalLineSales = 0;
    let totalLineOrders = 0;
    let unitsSold = 0;
    const matchingOrders: any[] = [];

    for (const order of allOrders) {
      const payload = order.payload as any;
      const lineItems = payload?.lineItems?.nodes || payload?.line_items || [];
      let foundInOrder = false;
      let orderQty = 0;

      for (const item of lineItems) {
        const itemTitle = (item.title || item.name || '').toLowerCase().trim();
        const itemSku = (item.sku || '').toLowerCase().trim();
        if (
          (pTitle && itemTitle && (itemTitle.includes(pTitle) || pTitle.includes(itemTitle))) ||
          (pHandle && itemSku && (itemSku.includes(pHandle) || pHandle.includes(itemSku)))
        ) {
          foundInOrder = true;
          const q = Number(item.quantity || 1);
          orderQty += q;
          const unitPrice = Number(item.originalUnitPriceSet?.shopMoney?.amount || item.price || 0);
          totalLineSales += unitPrice > 0 ? unitPrice * q : Number(order.total || 0);
          unitsSold += q;
        }
      }

      if (foundInOrder) {
        totalLineOrders++;
        if (matchingOrders.length < 10) {
          matchingOrders.push({
            id: order.id,
            name: order.name,
            email: order.email,
            total: order.total,
            currency: order.currency,
            financialStatus: order.financialStatus,
            fulfillmentStatus: order.fulfillmentStatus,
            processedAt: order.processedAt,
            creatorCode: order.creatorCode,
            quantity: orderQty,
          });
        }
      }
    }

    // Format affiliate links
    const baseUrl = config.publicBaseUrl ?? `http://${request.headers.host}`;
    let creatorRevenue = 0;
    let creatorOrders = 0;
    let creatorCommissionsTotal = 0;
    let totalClicks = 0;

    const formattedLinks = product.affiliateLinks.map((link: any) => {
      const clicks = Number(link._count?.clicks ?? 0);
      totalClicks += clicks;
      const commissions = link.commissions ?? [];
      const linkOrders = commissions.length;
      const linkRev = commissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount || 0), 0);
      const linkComm = commissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

      creatorRevenue += linkRev;
      creatorOrders += linkOrders;
      creatorCommissionsTotal += linkComm;

      const igHandle = link.creator?.instagramConnection?.username
        ? `@${link.creator.instagramConnection.username}`
        : link.creator?.creatorCode
        ? `@${link.creator.creatorCode}`
        : `@${link.creator?.email?.split('@')[0] || 'creator'}`;

      return {
        id: link.id,
        slug: link.slug,
        url: `${baseUrl}/r/${link.slug}`,
        commissionRate: Number(link.commissionRate),
        status: link.status,
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
        clicks,
        orders: linkOrders,
        revenue: Math.round(linkRev * 100) / 100,
        commission: Math.round(linkComm * 100) / 100,
        creator: link.creator
          ? {
              id: link.creator.id,
              name: link.creator.displayName,
              creatorCode: link.creator.creatorCode,
              handle: igHandle,
            }
          : null,
      };
    });

    // Format assigned creators
    const assignedCreators = assignedRows.map((row: any) => {
      const creator = row.influencer;
      const creatorLinks = formattedLinks.filter((l: any) => l.creator?.id === creator.id);
      const sales = creatorLinks.reduce((sum: number, l: any) => sum + l.revenue, 0);
      const orders = creatorLinks.reduce((sum: number, l: any) => sum + l.orders, 0);
      const commission = creatorLinks.reduce((sum: number, l: any) => sum + l.commission, 0);

      const igHandle = creator.instagramConnection?.username
        ? `@${creator.instagramConnection.username}`
        : creator.creatorCode
        ? `@${creator.creatorCode}`
        : `@${creator.email?.split('@')[0] || 'creator'}`;

      return {
        id: creator.id,
        name: creator.displayName,
        email: creator.email,
        creatorCode: creator.creatorCode,
        handle: igHandle,
        assignedAt: row.createdAt,
        activeLinksCount: creatorLinks.length,
        sales: Math.round(sales * 100) / 100,
        orders,
        commission: Math.round(commission * 100) / 100,
      };
    });

    const summary = productSummary(product);
    const totalRev = Math.max(totalLineSales, creatorRevenue);
    const totalOrd = Math.max(totalLineOrders, creatorOrders);
    const convRate = totalClicks > 0 ? (creatorOrders / totalClicks) * 100 : 0;

    return {
      product: {
        ...product,
        imageUrl: summary.imageUrl,
        inventoryTotal: summary.stock,
        price: summary.price,
        currency: summary.currency,
        shopDomain: store.shopDomain,
      },
      metrics: {
        totalRevenue: Math.round(totalRev * 100) / 100,
        totalOrders: totalOrd,
        unitsSold,
        creatorRevenue: Math.round(creatorRevenue * 100) / 100,
        creatorOrders,
        creatorCommissions: Math.round(creatorCommissionsTotal * 100) / 100,
        totalClicks,
        conversionRate: Math.round(convRate * 10) / 10,
      },
      assignedCreators,
      availableCreators,
      affiliateLinks: formattedLinks,
      recentOrders: matchingOrders,
    };
  });

  // POST /store/products/:productId/assignments - Assign creator to product + auto link
  const assignSchema = z.object({
    creatorId: z.string().min(1),
    commissionRate: z.coerce.number().min(0).max(100).default(10),
    generateLink: z.boolean().default(true),
  });

  app.post('/store/products/:productId/assignments', async (request, reply) => {
    const actor = requireRole(request, ['STORE_OWNER']);
    const store = await storeFor(app, actor.userId);
    const { productId } = request.params as { productId: string };
    const input = assignSchema.parse(request.body);

    const product = await prisma.shopifyProduct.findFirst({
      where: { id: productId, organizationId: store.id },
    });
    if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Product not found.', 404);

    await ensureProductAssignmentsTable(prisma);
    await ensureCreatorCode(prisma, input.creatorId);

    // Upsert assignment
    const id = `cpa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await prisma.$executeRaw`
      INSERT INTO "ProductInfluencerAssignment" ("id", "organizationId", "productId", "influencerId", "createdAt")
      VALUES (${id}, ${store.id}, ${productId}, ${input.creatorId}, NOW())
      ON CONFLICT ("productId", "influencerId") DO NOTHING
    `;

    let generatedLink = null;
    if (input.generateLink) {
      const slug = generateSlug();
      generatedLink = await prisma.affiliateLink.create({
        data: {
          organizationId: store.id,
          creatorId: input.creatorId,
          productId: product.id,
          targetType: 'PRODUCT',
          destinationPath: product.handle ? `/products/${product.handle}` : '/',
          commissionRate: input.commissionRate,
          slug,
        },
        include: {
          creator: { select: { displayName: true, creatorCode: true } },
          _count: { select: { clicks: true } },
        },
      });
    }

    const baseUrl = config.publicBaseUrl ?? `http://${request.headers.host}`;
    return reply.code(201).send({
      ok: true,
      link: generatedLink
        ? {
            id: generatedLink.id,
            slug: generatedLink.slug,
            url: `${baseUrl}/r/${generatedLink.slug}`,
            commissionRate: Number(generatedLink.commissionRate),
          }
        : null,
    });
  });

  // DELETE /store/products/:productId/assignments/:influencerId - Remove creator assignment
  app.delete('/store/products/:productId/assignments/:influencerId', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']);
    const store = await storeFor(app, actor.userId);
    const { productId, influencerId } = request.params as { productId: string; influencerId: string };

    await ensureProductAssignmentsTable(prisma);
    await prisma.$executeRaw`
      DELETE FROM "ProductInfluencerAssignment"
      WHERE "organizationId" = ${store.id} AND "productId" = ${productId} AND "influencerId" = ${influencerId}
    `;

    return { ok: true };
  });

  // POST /store/products/:productId/links - Quick create affiliate link for product
  const createProductLinkSchema = z.object({
    creatorId: z.string().optional().nullable(),
    commissionRate: z.coerce.number().min(0).max(100).default(10),
    expiresAt: z.coerce.date().optional().nullable(),
  });

  app.post('/store/products/:productId/links', async (request, reply) => {
    const actor = requireRole(request, ['STORE_OWNER']);
    const store = await storeFor(app, actor.userId);
    const { productId } = request.params as { productId: string };
    const input = createProductLinkSchema.parse(request.body);

    const product = await prisma.shopifyProduct.findFirst({
      where: { id: productId, organizationId: store.id },
    });
    if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Product not found.', 404);

    if (input.creatorId) {
      await ensureCreatorCode(prisma, input.creatorId);
    }

    const slug = generateSlug();
    const link = await prisma.affiliateLink.create({
      data: {
        organizationId: store.id,
        creatorId: input.creatorId || null,
        productId: product.id,
        targetType: 'PRODUCT',
        destinationPath: product.handle ? `/products/${product.handle}` : '/',
        commissionRate: input.commissionRate,
        expiresAt: input.expiresAt,
        slug,
      },
      include: {
        creator: { select: { displayName: true, creatorCode: true } },
        _count: { select: { clicks: true } },
      },
    });

    const baseUrl = config.publicBaseUrl ?? `http://${request.headers.host}`;
    return reply.code(201).send({
      ok: true,
      link: {
        id: link.id,
        slug: link.slug,
        url: `${baseUrl}/r/${link.slug}`,
        commissionRate: Number(link.commissionRate),
        createdAt: link.createdAt,
      },
    });
  });
};
