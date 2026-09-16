import { Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { decryptToken } from '../instagram/instagram.crypto.js';

type Node = Record<string, any>;
type Page = { items?: Node[]; pageInfo?: { hasNextPage: boolean; endCursor: string | null }; error?: string };
const query = `query Products($after: String) { products(first: 100, after: $after, sortKey: UPDATED_AT, reverse: true) { nodes { id title handle status vendor productType descriptionHtml totalInventory featuredImage { id url altText width height } images(first: 250) { nodes { id url altText width height } } priceRangeV2 { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } variants(first: 250) { nodes { id title sku price inventoryQuantity selectedOptions { name value } image { id url altText } inventoryItem { id tracked } } } } pageInfo { hasNextPage endCursor } } }`;

async function storeFor(app: Parameters<FastifyPluginAsync>[0], userId: string) {
  const store = await app.prisma.organization.findFirst({ where: { ownerId: userId }, select: { id: true, platform: true, connectionStatus: true, shopDomain: true, appUrl: true, shopifyConnectionMethod: true, encryptedShopifyAccessToken: true } });
  if (!store || store.platform !== 'SHOPIFY') throw new AppError('SHOPIFY_STORE_NOT_FOUND', 'No Shopify store is connected to this account.', 404);
  if (store.connectionStatus !== 'CONNECTED' || !store.shopDomain || !store.encryptedShopifyAccessToken || (store.shopifyConnectionMethod === 'CLI_APP' && !store.appUrl)) throw new AppError('SHOPIFY_NOT_CONNECTED', 'Complete the Shopify connection before syncing products.', 409);
  return store;
}
async function fetchPage(store: Awaited<ReturnType<typeof storeFor>>, after: string | null) {
  const shop = store.shopDomain!.replace(/^https?:\/\//, '').replace(/\/$/, ''); const token = decryptToken(store.encryptedShopifyAccessToken!);
  try {
    if (store.shopifyConnectionMethod === 'CLI_APP') {
      const url = new URL(`${store.appUrl!.replace(/\/$/, '')}/app/api/bridge/products`); url.searchParams.set('shop', shop); url.searchParams.set('first', '100'); if (after) url.searchParams.set('after', after);
      const response = await fetch(url, { headers: { 'X-MegaChat-Bridge-Token': token } }); const body = await response.json().catch(() => null) as Page | null;
      if (!response.ok || !body?.items || !body.pageInfo) throw new AppError('SHOPIFY_PRODUCTS_UNAVAILABLE', body?.error ?? 'Shopify bridge could not return products.', 502); return body as Required<Page>;
    }
    const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token }, body: JSON.stringify({ query, variables: { after } }) }); const body = await response.json().catch(() => null) as any; const products = body?.data?.products;
    if (!response.ok || body?.errors?.length || !products?.nodes || !products.pageInfo) throw new AppError('SHOPIFY_PRODUCTS_UNAVAILABLE', body?.errors?.[0]?.message ?? 'Shopify could not return products.', 502); return { items: products.nodes, pageInfo: products.pageInfo };
  } catch (error) { if (error instanceof AppError) throw error; throw new AppError('SHOPIFY_UNAVAILABLE', 'Unable to reach the connected Shopify store.', 502); }
}
function data(item: Node) { const raw = item.raw ?? item; const price = raw.priceRangeV2?.minVariantPrice; return { shopifyId: item.shopifyGid ?? raw.id, title: item.title ?? raw.title, handle: item.handle ?? raw.handle ?? null, status: item.status ?? raw.status ?? null, vendor: item.vendor ?? raw.vendor ?? null, productType: item.productType ?? raw.productType ?? null, descriptionHtml: raw.descriptionHtml ?? null, imageUrl: raw.featuredImage?.url ?? item.imageUrl ?? null, inventoryTotal: raw.totalInventory ?? 0, price: price?.amount ?? null, currency: price?.currencyCode ?? null, payload: raw as Prisma.InputJsonValue }; }

export const storeProductsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/store/products', async (request) => { const actor = requireRole(request, ['STORE_OWNER']); const store = await storeFor(app, actor.userId); const query = request.query as { page?: string; limit?: string }; const page = Math.max(1, Number(query.page) || 1); const limit = Math.min(100, Math.max(1, Number(query.limit) || 25)); const where = { organizationId: store.id }; const [rows, total] = await Promise.all([app.prisma.shopifyProduct.findMany({ where, orderBy: { syncedAt: 'desc' }, skip: (page - 1) * limit, take: limit }), app.prisma.shopifyProduct.count({ where })]); return { products: rows.map((p) => ({ id: p.id, name: p.title, sku: p.handle ?? '—', imageUrl: p.imageUrl, stock: p.inventoryTotal, price: p.price ?? '0', currency: p.currency ?? 'USD' })), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } }; });
  app.post('/store/products/sync', async (request) => { const actor = requireRole(request, ['STORE_OWNER']); const store = await storeFor(app, actor.userId); let after: string | null = null; let synced = 0; do { const page = await fetchPage(store, after); await Promise.all(page.items.map((item: Node) => { const product = data(item); return app.prisma.shopifyProduct.upsert({ where: { organizationId_shopifyId: { organizationId: store.id, shopifyId: product.shopifyId } }, create: { organizationId: store.id, ...product }, update: product }); })); synced += page.items.length; after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null; } while (after); return { synced }; });
  app.get('/store/products/:productId', async (request) => { const actor = requireRole(request, ['STORE_OWNER']); const store = await storeFor(app, actor.userId); const { productId } = request.params as { productId: string }; const product = await app.prisma.shopifyProduct.findFirst({ where: { id: productId, organizationId: store.id } }); if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Product not found.', 404); return { product }; });
};
