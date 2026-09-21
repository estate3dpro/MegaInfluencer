import { Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { decryptToken } from '../instagram/instagram.crypto.js';

type Node = Record<string, any>;
type Page = { items?: Node[]; pageInfo?: { hasNextPage: boolean; endCursor: string | null }; error?: string };
type SyncJob = { status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED'; synced: number; startedAt: string | null; completedAt: string | null; error: string | null };

// Product data is persisted page-by-page; job progress only needs to live for this API process.
const productSyncJobs = new Map<string, SyncJob>();
const query = `query Products($after: String) { products(first: 100, after: $after, sortKey: UPDATED_AT, reverse: true) { nodes { id title handle status vendor productType descriptionHtml totalInventory featuredImage { id url altText width height } images(first: 250) { nodes { id url altText width height } } priceRangeV2 { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } variants(first: 250) { nodes { id title sku price inventoryQuantity selectedOptions { name value } image { id url altText } inventoryItem { id tracked } } } } pageInfo { hasNextPage endCursor } } }`;

async function storeFor(app: Parameters<FastifyPluginAsync>[0], userId: string) {
  const store = await app.prisma.organization.findFirst({ where: { ownerId: userId }, select: { id: true, platform: true, connectionStatus: true, shopDomain: true, appUrl: true, shopifyConnectionMethod: true, encryptedShopifyAccessToken: true } });
  if (!store || store.platform !== 'SHOPIFY') throw new AppError('SHOPIFY_STORE_NOT_FOUND', 'No Shopify store is connected to this account.', 404);
  if (store.connectionStatus !== 'CONNECTED' || !store.shopDomain || !store.encryptedShopifyAccessToken || (store.shopifyConnectionMethod === 'CLI_APP' && !store.appUrl)) throw new AppError('SHOPIFY_NOT_CONNECTED', 'Complete the Shopify connection before syncing products.', 409);
  return store;
}

async function fetchPage(store: Awaited<ReturnType<typeof storeFor>>, after: string | null) {
  const shop = store.shopDomain!.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const token = decryptToken(store.encryptedShopifyAccessToken!);
  try {
    if (store.shopifyConnectionMethod === 'CLI_APP') {
      const url = new URL(`${store.appUrl!.replace(/\/$/, '')}/app/api/bridge/products`);
      url.searchParams.set('shop', shop); url.searchParams.set('first', '100'); if (after) url.searchParams.set('after', after);
      const response = await fetch(url, { headers: { 'X-MegaChat-Bridge-Token': token } });
      const body = await response.json().catch(() => null) as Page | null;
      if (!response.ok || !body?.items || !body.pageInfo) throw new AppError('SHOPIFY_PRODUCTS_UNAVAILABLE', body?.error ?? 'Shopify bridge could not return products.', 502);
      return body as Required<Page>;
    }
    const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token }, body: JSON.stringify({ query, variables: { after } }) });
    const body = await response.json().catch(() => null) as any;
    const products = body?.data?.products;
    if (!response.ok || body?.errors?.length || !products?.nodes || !products.pageInfo) throw new AppError('SHOPIFY_PRODUCTS_UNAVAILABLE', body?.errors?.[0]?.message ?? 'Shopify could not return products.', 502);
    return { items: products.nodes, pageInfo: products.pageInfo };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('SHOPIFY_UNAVAILABLE', 'Unable to reach the connected Shopify store.', 502);
  }
}

function data(item: Node) {
  const raw = item.raw ?? item;
  const price = raw.priceRangeV2?.minVariantPrice ?? raw.variants?.nodes?.[0];
  const inventoryTotal = raw.totalInventory ?? raw.variants?.nodes?.reduce((total: number, variant: Node) => total + (Number(variant.inventoryQuantity) || 0), 0) ?? 0;
  return { shopifyId: item.shopifyGid ?? raw.id, title: item.title ?? raw.title, handle: item.handle ?? raw.handle ?? null, status: item.status ?? raw.status ?? null, vendor: item.vendor ?? raw.vendor ?? null, productType: item.productType ?? raw.productType ?? null, descriptionHtml: raw.descriptionHtml ?? item.bodyHtml ?? null, imageUrl: raw.featuredImage?.url ?? item.imageUrl ?? item.images?.[0]?.url ?? null, inventoryTotal, price: price?.amount ?? price?.price ?? null, currency: item.currencyCode ?? price?.currencyCode ?? null, payload: raw as Prisma.InputJsonValue };
}

function productSummary(product: { id: string; title: string; handle: string | null; imageUrl: string | null; inventoryTotal: number; price: string | null; currency: string | null; payload: Prisma.JsonValue }) {
  // Older records were saved before the bridge returned price range and total inventory.
  // Read the variant values from their saved payload until the next background sync replaces them.
  const fallback = data({ raw: product.payload as Node });
  const hasFallbackPrice = fallback.price !== null && fallback.price !== undefined;
  return {
    id: product.id,
    name: product.title,
    sku: product.handle ?? '—',
    imageUrl: product.imageUrl ?? fallback.imageUrl,
    stock: product.inventoryTotal || fallback.inventoryTotal,
    price: product.price && Number(product.price) > 0 ? product.price : hasFallbackPrice ? String(fallback.price) : product.price ?? '0',
    // Shopify returns the price range currency for new syncs. INR is the safe legacy fallback for this India-facing store.
    currency: product.currency ?? fallback.currency ?? 'INR',
  };
}

async function runSync(app: Parameters<FastifyPluginAsync>[0], store: Awaited<ReturnType<typeof storeFor>>) {
  const job: SyncJob = { status: 'RUNNING', synced: 0, startedAt: new Date().toISOString(), completedAt: null, error: null };
  productSyncJobs.set(store.id, job);
  try {
    let after: string | null = null;
    do {
      const page = await fetchPage(store, after);
      await Promise.all(page.items.map((item: Node) => {
        const product = data(item);
        return app.prisma.shopifyProduct.upsert({ where: { organizationId_shopifyId: { organizationId: store.id, shopifyId: product.shopifyId } }, create: { organizationId: store.id, ...product }, update: product });
      }));
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
  app.get('/store/products', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']); const store = await storeFor(app, actor.userId);
    const requestQuery = request.query as { page?: string; limit?: string; search?: string; all?: string };
    const page = Math.max(1, Number(requestQuery.page) || 1); const limit = Math.min(100, Math.max(1, Number(requestQuery.limit) || 25)); const search = requestQuery.search?.trim(); const all = requestQuery.all === 'true';
    const where: Prisma.ShopifyProductWhereInput = { organizationId: store.id, ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { handle: { contains: search, mode: 'insensitive' } }, { vendor: { contains: search, mode: 'insensitive' } }, { productType: { contains: search, mode: 'insensitive' } }] } : {}) };
    const [rows, total] = await Promise.all([app.prisma.shopifyProduct.findMany({ where, orderBy: { title: 'asc' }, ...(all ? {} : { skip: (page - 1) * limit, take: limit }) }), app.prisma.shopifyProduct.count({ where })]);
    return { products: rows.map(productSummary), pagination: { page, limit: all ? total : limit, total, totalPages: all ? 1 : Math.max(1, Math.ceil(total / limit)) } };
  });
  app.get('/store/products/sync/status', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']); const store = await storeFor(app, actor.userId);
    return { sync: productSyncJobs.get(store.id) ?? { status: 'IDLE', synced: 0, startedAt: null, completedAt: null, error: null } satisfies SyncJob };
  });
  app.post('/store/products/sync', async (request, reply) => {
    const actor = requireRole(request, ['STORE_OWNER']); const store = await storeFor(app, actor.userId); const existing = productSyncJobs.get(store.id);
    if (existing?.status === 'RUNNING') return reply.status(202).send({ sync: existing, alreadyRunning: true });
    void runSync(app, store);
    const sync = productSyncJobs.get(store.id)!;
    return reply.status(202).send({ sync, alreadyRunning: false });
  });
  app.get('/store/products/:productId', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']); const store = await storeFor(app, actor.userId); const { productId } = request.params as { productId: string };
    const product = await app.prisma.shopifyProduct.findFirst({ where: { id: productId, organizationId: store.id } }); if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Product not found.', 404);
    const summary = productSummary(product);
    return { product: { ...product, imageUrl: summary.imageUrl, inventoryTotal: summary.stock, price: summary.price, currency: summary.currency } };
  });
};
