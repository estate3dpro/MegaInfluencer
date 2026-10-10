import { Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { decryptToken } from '../instagram/instagram.crypto.js';

type SyncJob = { status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED'; synced: number; startedAt: string | null; completedAt: string | null; error: string | null };
type CollectionNode = Record<string, any>;
const collectionSyncJobs = new Map<string, SyncJob>();

const collectionsQuery = `query Collections($after: String) { collections(first: 100, after: $after, sortKey: UPDATED_AT, reverse: true) { nodes { id title handle descriptionHtml image { url altText } productsCount { count } products(first: 250) { nodes { id } } } pageInfo { hasNextPage endCursor } } }`;
const collectionProductsQuery = `query CollectionProducts($id: ID!, $after: String) { collection(id: $id) { products(first: 250, after: $after) { nodes { id } pageInfo { hasNextPage endCursor } } } }`;

async function storeFor(app: Parameters<FastifyPluginAsync>[0], userId: string) {
  const store = await app.prisma.organization.findFirst({
    where: { ownerId: userId },
    select: { id: true, platform: true, connectionStatus: true, shopDomain: true, encryptedShopifyAccessToken: true, shopifyConnectionMethod: true },
  });
  if (!store || store.platform !== 'SHOPIFY') throw new AppError('SHOPIFY_STORE_NOT_FOUND', 'No Shopify store is connected to this account.', 404);
  if (store.connectionStatus !== 'CONNECTED' || !store.shopDomain || !store.encryptedShopifyAccessToken) {
    throw new AppError('SHOPIFY_NOT_CONNECTED', 'Complete the Shopify connection before syncing collections.', 409);
  }
  return store;
}

async function fetchCollections(store: Awaited<ReturnType<typeof storeFor>>, after: string | null) {
  const shop = store.shopDomain!.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const token = decryptToken(store.encryptedShopifyAccessToken!);
  try {
    const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query: collectionsQuery, variables: { after } }),
    });
    const body = await response.json().catch(() => null) as any;
    const collections = body?.data?.collections;
    if (!response.ok || body?.errors?.length || !collections?.nodes || !collections.pageInfo) {
      throw new AppError('SHOPIFY_COLLECTIONS_UNAVAILABLE', body?.errors?.[0]?.message ?? 'Shopify could not return collections.', 502);
    }
    return collections as { nodes: CollectionNode[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('SHOPIFY_UNAVAILABLE', 'Unable to reach the connected Shopify store.', 502);
  }
}

async function fetchAllCollectionProductIds(store: Awaited<ReturnType<typeof storeFor>>, collectionId: string) {
  const shop = store.shopDomain!.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const token = decryptToken(store.encryptedShopifyAccessToken!);
  const ids: string[] = [];
  let after: string | null = null;
  do {
    const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token }, body: JSON.stringify({ query: collectionProductsQuery, variables: { id: collectionId, after } }) });
    const body = await response.json().catch(() => null) as any;
    const products = body?.data?.collection?.products;
    if (!response.ok || body?.errors?.length || !products?.nodes || !products.pageInfo) throw new AppError('SHOPIFY_COLLECTIONS_UNAVAILABLE', body?.errors?.[0]?.message ?? 'Shopify could not return collection products.', 502);
    ids.push(...products.nodes.map((product: any) => product.id).filter(Boolean));
    after = products.pageInfo.hasNextPage ? products.pageInfo.endCursor : null;
  } while (after);
  return ids;
}

async function runSync(app: Parameters<FastifyPluginAsync>[0], store: Awaited<ReturnType<typeof storeFor>>) {
  const job: SyncJob = { status: 'RUNNING', synced: 0, startedAt: new Date().toISOString(), completedAt: null, error: null };
  collectionSyncJobs.set(store.id, job);
  try {
    let after: string | null = null;
    do {
      const page = await fetchCollections(store, after);
      for (const raw of page.nodes) {
        const collection = await (app.prisma as any).shopifyCollection.upsert({
          where: { organizationId_shopifyId: { organizationId: store.id, shopifyId: raw.id } },
          create: { organizationId: store.id, shopifyId: raw.id, title: raw.title, handle: raw.handle ?? null, descriptionHtml: raw.descriptionHtml ?? null, imageUrl: raw.image?.url ?? null, productCount: Number(raw.productsCount?.count ?? 0), payload: raw as Prisma.InputJsonValue },
          update: { title: raw.title, handle: raw.handle ?? null, descriptionHtml: raw.descriptionHtml ?? null, imageUrl: raw.image?.url ?? null, productCount: Number(raw.productsCount?.count ?? 0), payload: raw as Prisma.InputJsonValue },
        });
        const shopifyIds = await fetchAllCollectionProductIds(store, raw.id);
        const products = shopifyIds.length ? await (app.prisma as any).shopifyProduct.findMany({ where: { organizationId: store.id, shopifyId: { in: shopifyIds } }, select: { id: true, shopifyId: true } }) : [];
        const productByShopifyId = new Map(products.map((product: any) => [product.shopifyId, product.id]));
        await (app.prisma as any).shopifyCollectionProduct.deleteMany({ where: { collectionId: collection.id } });
        const memberships = shopifyIds.map((shopifyId: string, position: number) => productByShopifyId.get(shopifyId) ? { collectionId: collection.id, productId: productByShopifyId.get(shopifyId), position } : null).filter(Boolean);
        if (memberships.length) await (app.prisma as any).shopifyCollectionProduct.createMany({ data: memberships });
      }
      job.synced += page.nodes.length;
      after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    } while (after);
    job.status = 'COMPLETED';
  } catch (error) {
    job.status = 'FAILED'; job.error = error instanceof Error ? error.message : 'Collection sync failed.'; app.log.error(error, 'Shopify collection sync failed');
  } finally { job.completedAt = new Date().toISOString(); }
}

export const storeCollectionsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;
  app.get('/store/collections', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']); const store = await storeFor(app, actor.userId);
    const search = String((request.query as { search?: string }).search ?? '').trim();
    const collections = await prisma.shopifyCollection.findMany({
      where: { organizationId: store.id, ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}) },
      include: { _count: { select: { products: true, affiliateLinks: true } } }, orderBy: { title: 'asc' },
    });
    return { collections: collections.map((collection: any) => ({ id: collection.id, shopifyId: collection.shopifyId, title: collection.title, handle: collection.handle, imageUrl: collection.imageUrl, productCount: collection._count.products || collection.productCount, activeLinksCount: collection._count.affiliateLinks, syncedAt: collection.syncedAt })) };
  });
  app.get('/store/collections/sync/status', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']); const store = await storeFor(app, actor.userId);
    return { sync: collectionSyncJobs.get(store.id) ?? { status: 'IDLE', synced: 0, startedAt: null, completedAt: null, error: null } };
  });
  app.post('/store/collections/sync', async (request, reply) => {
    const actor = requireRole(request, ['STORE_OWNER']); const store = await storeFor(app, actor.userId);
    const existing = collectionSyncJobs.get(store.id);
    if (existing?.status === 'RUNNING') return reply.status(202).send({ sync: existing, alreadyRunning: true });
    void runSync(app, store);
    return reply.status(202).send({ sync: collectionSyncJobs.get(store.id), alreadyRunning: false });
  });
};
