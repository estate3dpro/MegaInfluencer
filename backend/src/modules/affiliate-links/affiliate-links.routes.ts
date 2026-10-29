import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config } from '../../config/env.js';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ensureCreatorCode } from '../../shared/creator-code.js';
import { getFrontendBaseUrl } from '../../shared/helpers/frontend-url.js';
import { buildDirectStoreUrl } from '../../shared/helpers/affiliate-url.js';
import { getCreatorAttributions } from './creator-attribution.service.js';
import { calculateOrderCommission } from '../store/commission-calculator.js';

const createLinkSchema = z.object({
  creatorId: z.string().min(1).optional().nullable(), productId: z.string().min(1).optional().nullable(),
  productIds: z.array(z.string().min(1)).min(2).max(50).optional(),
  collectionId: z.string().min(1).optional().nullable(),
  commissionType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).default('PERCENTAGE'),
  commissionRate: z.coerce.number().min(0).max(999.99).default(10),
  commissionAmount: z.coerce.number().min(0).optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});
const updateLinkSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED']).optional(),
  commissionType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  commissionRate: z.coerce.number().min(0).max(999.99).optional(),
  commissionAmount: z.coerce.number().min(0).optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

async function organizationFor(app: Parameters<FastifyPluginAsync>[0], userId: string) {
  const organization = await app.prisma.organization.findFirst({ where: { ownerId: userId }, select: { id: true, shopDomain: true } });
  if (!organization) throw new AppError('STORE_NOT_FOUND', 'Store not found.', 404);
  return organization;
}
function slug() { return randomBytes(9).toString('base64url'); }
function safeDestination(shopDomain: string | null, path: string) {
  if (!shopDomain) throw new AppError('SHOPIFY_NOT_CONNECTED', 'Connect a Shopify store before creating a link.', 409);
  const base = new URL(`https://${shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`);
  return new URL(path, base);
}
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
}
function asLink(row: any, baseUrl: string) {
  const clicks = Number(row._count?.clicks ?? 0);
  const commissions = (row.commissions ?? []).filter((commission: any) => commission.status !== 'REVERSED');
  const trackedOrders = (row.trackedOrders ?? []).filter((order: any) => !['refunded', 'voided', 'cancelled'].includes(String(order.financialStatus ?? '').toLowerCase()));
  // A Shopify order can be attributed before its commission ledger is created
  // (for example while a webhook is retried). Count those orders once rather
  // than showing zero orders/GMV for an already attributed affiliate link.
  const commissionedOrderIds = new Set(commissions.map((commission: any) => commission.shopifyOrderId).filter(Boolean));
  const pendingTrackedOrders = trackedOrders.filter((order: any) => !commissionedOrderIds.has(order.id));
  const orders = commissions.length + pendingTrackedOrders.length;
  const revenue = commissions.reduce((sum: number, commission: any) => sum + Number(commission.orderAmount), 0)
    + pendingTrackedOrders.reduce((sum: number, order: any) => sum + Number(order.total ?? 0), 0);
  const storeCredits = row.creatorId ? 0 : commissions.reduce((sum: number, commission: any) => sum + Number(commission.amount), 0);
  const creatorCode = row.creator?.creatorCode ?? null;
  const shopDomain = row.organization?.storefrontDomain ?? row.organization?.shopDomain ?? null;
  const directUrl = buildDirectStoreUrl({
    shopDomain,
    destinationPath: row.destinationPath,
    slug: row.slug,
    creatorCode,
  });

  return {
    id: row.id,
    storeId: row.organizationId,
    storeName: row.organization?.name ?? 'Store',
    storeSlug: row.organization?.slug ?? 'store',
    shopDomain,
    creatorId: row.creatorId,
    creator: row.creator?.displayName ?? null,
    creatorCode,
    productId: row.productId,
    product: row.product?.title ?? null,
    collectionId: row.collectionId ?? null,
    collection: row.collection?.title ?? null,
    slug: row.slug,
    url: `${baseUrl}/r/${row.slug}`,
    directUrl,
    destinationPath: row.destinationPath,
    targetType: row.targetType,
    commissionType: row.commissionType ?? 'PERCENTAGE',
    commissionRate: Number(row.commissionRate),
    commissionAmount: row.commissionAmount !== null && row.commissionAmount !== undefined ? Number(row.commissionAmount) : null,
    status: row.status,
    expiresAt: row.expiresAt,
    clicks,
    orders,
    revenue,
    storeCredits,
    conversion: clicks ? orders / clicks : 0,
    createdAt: row.createdAt,
  };
}

export const affiliateLinkRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;
  // Used by the Shopify app embed on /pages/shop?code=<affiliate-link-slug>.
  // It deliberately returns a same-store destination rather than sending the
  // shopper through the MegaInfluencer redirect domain.
  app.get('/public/affiliate-links/:slug/resolve', async (request, reply) => {
    const { slug: linkSlug } = request.params as { slug: string };
    const link = await prisma.affiliateLink.findUnique({
      where: { slug: linkSlug },
      include: {
        organization: { select: { shopDomain: true, storefrontDomain: true } },
        creator: { select: { creatorCode: true } },
        collection: { select: { handle: true } },
      },
    });
    if (!link || link.status !== 'ACTIVE' || (link.expiresAt && link.expiresAt <= new Date())) {
      throw new AppError('AFFILIATE_LINK_NOT_FOUND', 'This affiliate link is unavailable.', 404);
    }

    const publicDomain = link.organization.storefrontDomain ?? link.organization.shopDomain;
    const landingPath = link.targetType === 'COLLECTION' && link.collection?.handle
      ? `/collections/${link.collection.handle}`
      : link.destinationPath;
    const destination = safeDestination(publicDomain, landingPath);
    destination.searchParams.set('mi_link', link.slug);
    if (link.creatorId) {
      const creatorCode = link.creator?.creatorCode ?? await ensureCreatorCode(prisma, link.creatorId);
      destination.searchParams.set('mi_creator_code', creatorCode);
      destination.searchParams.set('utm_creator_code', creatorCode);
    }

    const visitorHash = request.headers['user-agent']
      ? createHash('sha256').update(`${request.headers['user-agent']}|${request.ip}`).digest('hex')
      : null;
    await prisma.affiliateLinkClick.create({
      data: { organizationId: link.organizationId, linkId: link.id, visitorHash, referrer: request.headers.referer?.slice(0, 2_000) },
    });
    return reply.header('Cache-Control', 'no-store').send({ destinationUrl: destination.toString() });
  });

  // Public click tracking endpoint used by tracking.js when visitors land directly on ?code=<slug>
  app.route({
    method: ['GET', 'POST'],
    url: '/public/affiliate-links/:slug/click',
    handler: async (request, reply) => {
      const { slug: linkSlug } = request.params as { slug: string };
      const query = request.query as { ref?: string };
      const link = await prisma.affiliateLink.findUnique({
        where: { slug: linkSlug },
        select: { id: true, organizationId: true, status: true, expiresAt: true },
      });
      if (!link || link.status !== 'ACTIVE' || (link.expiresAt && link.expiresAt <= new Date())) {
        return reply.header('Access-Control-Allow-Origin', '*').header('Cache-Control', 'no-store').send({ ok: false });
      }

      const visitorHash = request.headers['user-agent']
        ? createHash('sha256').update(`${request.headers['user-agent']}|${request.ip}`).digest('hex')
        : null;
      const referrer = query.ref || (request.headers.referer ? String(request.headers.referer).slice(0, 2_000) : null);

      await prisma.affiliateLinkClick.create({
        data: { organizationId: link.organizationId, linkId: link.id, visitorHash, referrer },
      });

      return reply.header('Access-Control-Allow-Origin', '*').header('Cache-Control', 'no-store').send({ ok: true });
    },
  });

  app.get('/store/affiliate-links', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']); const organization = await organizationFor(app, actor.userId);
    const query = request.query as { search?: string; status?: 'ACTIVE' | 'PAUSED' };
    const rows = await prisma.affiliateLink.findMany({
      where: { organizationId: organization.id, ...(query.status ? { status: query.status } : {}), ...(query.search ? { OR: [{ slug: { contains: query.search, mode: 'insensitive' } }, { creator: { displayName: { contains: query.search, mode: 'insensitive' } } }, { creator: { creatorCode: { contains: query.search, mode: 'insensitive' } } }, { product: { title: { contains: query.search, mode: 'insensitive' } } }] } : {}) },
      include: { organization: { select: { id: true, name: true, slug: true, shopDomain: true, storefrontDomain: true } }, creator: { select: { displayName: true, creatorCode: true } }, product: { select: { title: true } }, collection: { select: { title: true } }, _count: { select: { clicks: true } }, commissions: { select: { shopifyOrderId: true, orderAmount: true, status: true } }, trackedOrders: { select: { id: true, total: true, financialStatus: true } } }, orderBy: { createdAt: 'desc' },
    });
    const baseUrl = getFrontendBaseUrl(request);
    return { links: rows.map((row: any) => asLink(row, baseUrl)) };
  });

  app.post('/store/affiliate-links', async (request, reply) => {
    const actor = requireRole(request, ['STORE_OWNER']); const organization = await organizationFor(app, actor.userId); const input = createLinkSchema.parse(request.body);
    if (input.commissionType === 'FIXED_AMOUNT' && (!input.commissionAmount || input.commissionAmount <= 0)) {
      throw new AppError('INVALID_COMMISSION_AMOUNT', 'Flat commission amount must be greater than 0.', 422);
    }
    if ([input.productId, input.collectionId, input.productIds?.length ? 'products' : null].filter(Boolean).length > 1) {
      throw new AppError('INVALID_LINK_TARGET', 'Choose one product, one Shopify collection, or a custom product collection.', 422);
    }
    if (input.productIds && new Set(input.productIds).size !== input.productIds.length) {
      throw new AppError('DUPLICATE_PRODUCTS', 'A product can only be selected once.', 422);
    }
    if (input.creatorId) {
      const assigned = await prisma.storeInfluencerAssignment.findUnique({ where: { organizationId_influencerId: { organizationId: organization.id, influencerId: input.creatorId } } });
      if (!assigned) throw new AppError('CREATOR_NOT_ASSIGNED', 'Choose a creator assigned to this store.', 422);
      await ensureCreatorCode(prisma, input.creatorId);
    }
    const product = input.productId ? await prisma.shopifyProduct.findFirst({ where: { id: input.productId, organizationId: organization.id }, select: { id: true, handle: true } }) : null;
    if (input.productId && !product) throw new AppError('PRODUCT_NOT_FOUND', 'The selected product does not belong to this store.', 422);
    const collection = input.collectionId ? await prisma.shopifyCollection.findFirst({ where: { id: input.collectionId, organizationId: organization.id }, select: { id: true, title: true, handle: true } }) : null;
    if (input.collectionId && !collection) throw new AppError('COLLECTION_NOT_FOUND', 'The selected Shopify collection does not belong to this store.', 422);
    const collectionProducts = input.productIds?.length
      ? await prisma.shopifyProduct.findMany({ where: { id: { in: input.productIds }, organizationId: organization.id }, select: { id: true } })
      : [];
    if (input.productIds?.length && collectionProducts.length !== input.productIds.length) {
      throw new AppError('PRODUCT_NOT_FOUND', 'One or more selected products do not belong to this store.', 422);
    }
    const link = await prisma.affiliateLink.create({
      data: {
        organizationId: organization.id,
        creatorId: input.creatorId,
        productId: product?.id,
        collectionId: collection?.id,
        targetType: collection || collectionProducts.length ? 'COLLECTION' : product ? 'PRODUCT' : 'STORE',
        destinationPath: collection?.handle ? `/collections/${collection.handle}` : product?.handle ? `/products/${product.handle}` : '/',
        commissionType: input.commissionType,
        commissionRate: input.commissionType === 'PERCENTAGE' ? input.commissionRate : 0,
        commissionAmount: input.commissionType === 'FIXED_AMOUNT' ? (input.commissionAmount ?? 0) : null,
        expiresAt: input.expiresAt,
        slug: slug(),
        products: collectionProducts.length ? { create: input.productIds!.map((productId, position) => ({ productId, position })) } : undefined,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true, shopDomain: true, storefrontDomain: true } },
        creator: { select: { displayName: true, creatorCode: true } },
        product: { select: { title: true } },
        collection: { select: { title: true } },
        _count: { select: { clicks: true } },
        commissions: { select: { shopifyOrderId: true, orderAmount: true, status: true } },
        trackedOrders: { select: { id: true, total: true, financialStatus: true } },
      },
    });
    const baseUrl = getFrontendBaseUrl(request);
    return reply.code(201).send({ link: asLink(link, baseUrl) });
  });

  app.patch('/store/affiliate-links/:linkId', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']);
    const organization = await organizationFor(app, actor.userId);
    const { linkId } = request.params as { linkId: string };
    const input = updateLinkSchema.parse(request.body);
    const existing = await prisma.affiliateLink.findFirst({
      where: { id: linkId, organizationId: organization.id },
    });
    if (!existing) throw new AppError('AFFILIATE_LINK_NOT_FOUND', 'Affiliate link not found.', 404);

    const targetCommissionType = input.commissionType ?? existing.commissionType;
    let targetCommissionRate = input.commissionRate !== undefined ? input.commissionRate : Number(existing.commissionRate);
    let targetCommissionAmount = input.commissionAmount !== undefined ? input.commissionAmount : (existing.commissionAmount ? Number(existing.commissionAmount) : null);

    if (targetCommissionType === 'FIXED_AMOUNT') {
      if (targetCommissionAmount === null || targetCommissionAmount === undefined || targetCommissionAmount <= 0) {
        throw new AppError('INVALID_COMMISSION_AMOUNT', 'Flat commission amount must be greater than 0.', 422);
      }
    } else if (targetCommissionType === 'PERCENTAGE') {
      if (input.commissionAmount === undefined && input.commissionType === 'PERCENTAGE') {
        targetCommissionAmount = null;
      }
    }

    const link = await prisma.affiliateLink.update({
      where: { id: linkId },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
        commissionType: targetCommissionType,
        commissionRate: targetCommissionRate,
        commissionAmount: targetCommissionAmount,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true, shopDomain: true, storefrontDomain: true } },
        creator: { select: { displayName: true, creatorCode: true } },
        product: { select: { title: true } },
        collection: { select: { title: true } },
        _count: { select: { clicks: true } },
        commissions: { select: { id: true, shopifyOrderId: true, orderAmount: true, amount: true, status: true } },
        trackedOrders: { select: { id: true, total: true, financialStatus: true } },
      },
    });
    const baseUrl = getFrontendBaseUrl(request);
    return { link: asLink(link, baseUrl) };
  });

  // Full attribution report for one link. This deliberately includes tracked
  // orders that are awaiting commission reconciliation, so operators see the
  // real order journey rather than a misleading empty report.
  app.get('/store/affiliate-links/:linkId/report', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']);
    const organization = await organizationFor(app, actor.userId);
    const { linkId } = request.params as { linkId: string };
    const link = await prisma.affiliateLink.findFirst({
      where: { id: linkId, organizationId: organization.id },
      include: {
        creator: { select: { id: true, displayName: true, creatorCode: true, email: true, instagramConnection: { select: { username: true } } } },
        product: { select: { title: true } },
        collection: { select: { title: true } },
        _count: { select: { clicks: true } },
        commissions: {
          include: { shopifyOrder: { select: { id: true, name: true, email: true, total: true, currency: true, financialStatus: true, fulfillmentStatus: true, processedAt: true } } },
        },
        trackedOrders: { select: { id: true, name: true, email: true, total: true, currency: true, financialStatus: true, fulfillmentStatus: true, processedAt: true } },
      },
    });
    if (!link) throw new AppError('AFFILIATE_LINK_NOT_FOUND', 'Affiliate link not found.', 404);

    const reportOrders = new Map<string, any>();
    for (const commission of link.commissions) {
      const order = commission.shopifyOrder;
      if (!order) continue;
      reportOrders.set(order.id, {
        id: order.id,
        name: order.name,
        email: order.email,
        amount: Number(order.total ?? commission.orderAmount ?? 0),
        currency: order.currency ?? 'INR',
        financialStatus: order.financialStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        processedAt: order.processedAt,
        commissionAmount: Number(commission.amount ?? 0),
        commissionStatus: commission.status,
        commissionType: commission.commissionType,
        commissionRate: Number(commission.commissionRate ?? 0),
        isEstimated: false,
      });
    }
    for (const order of link.trackedOrders) {
      if (reportOrders.has(order.id)) continue;
      const orderAmount = Number(order.total ?? 0);
      // The order is already verified as belonging to this link. Its ledger
      // may still be waiting for the webhook/order-sync retry, but the link's
      // own reward rule lets us show the creator's expected earning now.
      const expectedCommissionAmount = link.commissionType === 'FIXED_AMOUNT'
        ? Number(link.commissionAmount ?? 0)
        : (orderAmount * Number(link.commissionRate ?? 0)) / 100;
      reportOrders.set(order.id, {
        id: order.id,
        name: order.name,
        email: order.email,
        amount: orderAmount,
        currency: order.currency ?? 'INR',
        financialStatus: order.financialStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        processedAt: order.processedAt,
        commissionAmount: expectedCommissionAmount,
        commissionStatus: null,
        commissionType: link.commissionType,
        commissionRate: link.commissionType === 'FIXED_AMOUNT' ? 0 : Number(link.commissionRate ?? 0),
        isEstimated: true,
      });
    }

    const orders = [...reportOrders.values()].sort((a, b) =>
      new Date(b.processedAt ?? 0).getTime() - new Date(a.processedAt ?? 0).getTime(),
    );
    const qualifyingOrders = orders.filter((order) => !['refunded', 'voided', 'cancelled'].includes(String(order.financialStatus ?? '').toLowerCase()) && order.commissionStatus !== 'REVERSED');
    const gmv = qualifyingOrders.reduce((sum, order) => sum + order.amount, 0);
    const creatorEarnings = qualifyingOrders.reduce((sum, order) => sum + order.commissionAmount, 0);
    const clicks = Number(link._count.clicks ?? 0);

    return {
      link: {
        id: link.id,
        slug: link.slug,
        destination: link.product?.title ?? link.collection?.title ?? 'Storewide link',
        targetType: link.targetType,
        status: link.status,
        commissionType: link.commissionType,
        commissionRate: Number(link.commissionRate ?? 0),
        commissionAmount: link.commissionAmount === null ? null : Number(link.commissionAmount),
        creator: link.creator ? {
          id: link.creator.id,
          name: link.creator.displayName,
          creatorCode: link.creator.creatorCode,
          email: link.creator.email,
          instagramUsername: link.creator.instagramConnection?.username ?? null,
        } : null,
      },
      metrics: {
        clicks,
        totalOrders: qualifyingOrders.length,
        gmv,
        averageOrderAmount: qualifyingOrders.length ? gmv / qualifyingOrders.length : 0,
        creatorEarnings,
        conversionRate: clicks ? qualifyingOrders.length / clicks : 0,
      },
      orders,
    };
  });

  app.get('/influencer/affiliate-links', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const query = request.query as { search?: string; storeId?: string };
    const [rows, assignments, attributions] = await Promise.all([
      prisma.affiliateLink.findMany({
        where: {
          creatorId: actor.userId,
          ...(query.storeId ? { organizationId: query.storeId } : {}),
          ...(query.search ? {
            OR: [
              { slug: { contains: query.search, mode: 'insensitive' } },
              { product: { title: { contains: query.search, mode: 'insensitive' } } },
              { organization: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          } : {}),
        },
        include: {
          organization: { select: { id: true, name: true, slug: true, shopDomain: true, storefrontDomain: true } },
          creator: { select: { creatorCode: true, displayName: true } },
          product: { select: { id: true, title: true, imageUrl: true, price: true } },
          products: { include: { product: { select: { id: true, title: true, imageUrl: true, price: true } } }, orderBy: { position: 'asc' } },
          _count: { select: { clicks: true } },
          commissions: { select: { orderAmount: true, amount: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.storeInfluencerAssignment.findMany({
        where: { influencerId: actor.userId },
        select: { organizationId: true, compensationMode: true },
      }),
      getCreatorAttributions(prisma, actor.userId, { scope: query.storeId }),
    ]);
    const barterOrganizationIds = new Set(
      assignments.filter((assignment: any) => assignment.compensationMode === 'BARTER').map((assignment: any) => assignment.organizationId),
    );

    const baseUrl = getFrontendBaseUrl(request);
    const attributionsByLinkId = new Map<string, any[]>();
    for (const attribution of attributions) {
      const linkId = attribution.link?.id;
      if (!linkId || attribution.status === 'REVERSED') continue;
      const items = attributionsByLinkId.get(linkId) ?? [];
      items.push(attribution);
      attributionsByLinkId.set(linkId, items);
    }
    return {
      isBarterOnly: assignments.length > 0 && assignments.every((assignment: any) => assignment.compensationMode === 'BARTER'),
      links: rows.map((row: any) => {
        const clicks = Number(row._count?.clicks ?? 0);
        const linkAttributions = attributionsByLinkId.get(row.id) ?? [];
        const orders = linkAttributions.length;
        const revenue = linkAttributions.reduce((sum: number, attribution: any) => sum + Number(attribution.orderAmount), 0);
        const isBarter = barterOrganizationIds.has(row.organizationId);
        const earnings = isBarter ? 0 : linkAttributions.reduce((sum: number, attribution: any) => sum + Number(attribution.commissionAmount), 0);

        const creatorCode = row.creator?.creatorCode ?? null;
        const shopDomain = row.organization?.storefrontDomain ?? row.organization?.shopDomain ?? null;
        const directUrl = buildDirectStoreUrl({
          shopDomain,
          destinationPath: row.destinationPath,
          slug: row.slug,
          creatorCode,
        });

        return {
          id: row.id,
          storeId: row.organizationId,
          storeName: row.organization?.name ?? 'Store',
          storeSlug: row.organization?.slug ?? 'store',
          shopDomain,
          creatorCode,
          productId: row.productId,
          productTitle: row.product?.title ?? null,
          productImage: row.product?.imageUrl ?? null,
          productPrice: row.product?.price ?? null,
          products: (row.products ?? []).map((item: any) => ({ id: item.product.id, title: item.product.title, imageUrl: item.product.imageUrl, price: item.product.price })),
          productCount: row.products?.length ?? 0,
          slug: row.slug,
          url: `${baseUrl}/r/${row.slug}`,
          directUrl,
          destinationPath: row.destinationPath,
          targetType: row.targetType,
          commissionType: row.commissionType ?? 'PERCENTAGE',
          commissionRate: isBarter ? 0 : Number(row.commissionRate),
          commissionAmount: isBarter ? 0 : (row.commissionAmount !== null && row.commissionAmount !== undefined ? Number(row.commissionAmount) : null),
          isBarter,
          status: row.status,
          clicks,
          orders,
          revenue,
          earnings,
          conversion: clicks ? `${((orders / clicks) * 100).toFixed(1)}%` : '0.0%',
          createdAt: row.createdAt,
        };
      }),
    };
  });

  const createInfluencerLinkSchema = z.object({
    organizationId: z.string().min(1),
    productId: z.string().min(1).optional().nullable(),
    productIds: z.array(z.string().min(1)).min(2).max(50).optional(),
    customSlug: z.string().trim().regex(/^[a-zA-Z0-9_-]{3,50}$/, 'Slug must be 3-50 alphanumeric characters').optional().nullable(),
  });

  app.post('/influencer/affiliate-links', async (request, reply) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const input = createInfluencerLinkSchema.parse(request.body);
    if (input.productId && input.productIds?.length) {
      throw new AppError('INVALID_LINK_TARGET', 'Choose either one product or a product collection.', 422);
    }
    if (input.productIds && new Set(input.productIds).size !== input.productIds.length) {
      throw new AppError('DUPLICATE_PRODUCTS', 'A product can only be selected once.', 422);
    }

    const organization = await prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: { id: true, shopDomain: true, name: true, slug: true, category: true },
    });
    if (!organization) throw new AppError('STORE_NOT_FOUND', 'Store not found.', 404);

    let assigned = await prisma.storeInfluencerAssignment.findUnique({
      where: { organizationId_influencerId: { organizationId: organization.id, influencerId: actor.userId } },
    });
    if (!assigned) {
      let autoApprove = true;
      if (organization.category) {
        try {
          const parsed = JSON.parse(organization.category);
          if (typeof parsed.autoApprove === 'boolean') {
            autoApprove = parsed.autoApprove;
          }
        } catch {
          if (organization.category.includes('MANUAL_APPROVE')) autoApprove = false;
        }
      }

      if (autoApprove) {
        assigned = await prisma.storeInfluencerAssignment.create({
          data: {
            organizationId: organization.id,
            influencerId: actor.userId,
            compensationMode: 'COMMISSION',
          },
        });
      } else {
        await prisma.storeInfluencerAssignment.create({
          data: {
            organizationId: organization.id,
            influencerId: actor.userId,
            compensationMode: 'PENDING',
          },
        });
        throw new AppError('APPROVAL_PENDING', 'This store requires manual creator approval. Your application has been submitted to the store owner for review.', 403);
      }
    } else if (assigned.compensationMode === 'PENDING') {
      throw new AppError('APPROVAL_PENDING', 'Your application to partner with this store is pending manual review by the store owner.', 403);
    }

    let product = null;
    if (input.productId) {
      product = await prisma.shopifyProduct.findFirst({
        where: { id: input.productId, organizationId: organization.id },
        select: { id: true, title: true, handle: true, imageUrl: true, price: true },
      });
      if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'The selected product does not belong to this store.', 404);
    }
    const collectionProducts = input.productIds?.length
      ? await prisma.shopifyProduct.findMany({
        where: { id: { in: input.productIds }, organizationId: organization.id },
        select: { id: true, title: true, imageUrl: true, price: true },
      })
      : [];
    if (input.productIds?.length && collectionProducts.length !== input.productIds.length) {
      throw new AppError('PRODUCT_NOT_FOUND', 'One or more selected products do not belong to this store.', 404);
    }

    await ensureCreatorCode(prisma, actor.userId);

    const linkSlug = input.customSlug || slug();
    if (input.customSlug) {
      const existing = await prisma.affiliateLink.findUnique({ where: { slug: input.customSlug } });
      if (existing) throw new AppError('SLUG_TAKEN', 'This link slug is already taken.', 409);
    }

    const link = await prisma.affiliateLink.create({
      data: {
        organizationId: organization.id,
        creatorId: actor.userId,
        productId: product?.id ?? null,
        targetType: collectionProducts.length ? 'COLLECTION' : product ? 'PRODUCT' : 'STORE',
        destinationPath: product?.handle ? `/products/${product.handle}` : '/',
        commissionRate: 10,
        slug: linkSlug,
        products: collectionProducts.length
          ? { create: input.productIds!.map((productId, position) => ({ productId, position })) }
          : undefined,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true, shopDomain: true, storefrontDomain: true } },
        creator: { select: { creatorCode: true, displayName: true } },
        product: { select: { id: true, title: true, imageUrl: true, price: true } },
        products: { include: { product: { select: { id: true, title: true, imageUrl: true, price: true } } }, orderBy: { position: 'asc' } },
        _count: { select: { clicks: true } },
        commissions: { select: { orderAmount: true, amount: true, status: true } },
      },
    });

    const baseUrl = getFrontendBaseUrl(request);
    const creatorCode = link.creator?.creatorCode ?? null;
    const shopDomain = link.organization?.storefrontDomain ?? link.organization?.shopDomain ?? null;
    const directUrl = buildDirectStoreUrl({
      shopDomain,
      destinationPath: link.destinationPath,
      slug: link.slug,
      creatorCode,
    });

    return reply.code(201).send({
      link: {
        id: link.id,
        storeId: link.organizationId,
        storeName: link.organization?.name ?? 'Store',
        storeSlug: link.organization?.slug ?? 'store',
        shopDomain,
        creatorCode,
        productId: link.productId,
        productTitle: link.product?.title ?? null,
        productImage: link.product?.imageUrl ?? null,
        productPrice: link.product?.price ?? null,
        products: (link.products ?? []).map((item: any) => ({ id: item.product.id, title: item.product.title, imageUrl: item.product.imageUrl, price: item.product.price })),
        productCount: link.products?.length ?? 0,
        slug: link.slug,
        url: `${baseUrl}/r/${link.slug}`,
        directUrl,
        destinationPath: link.destinationPath,
        targetType: link.targetType,
        commissionRate: Number(link.commissionRate),
        status: link.status,
        clicks: 0,
        orders: 0,
        revenue: 0,
        earnings: 0,
        conversion: '0.0%',
        createdAt: link.createdAt,
      },
    });
  });

};

export const affiliateTrackingRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  // Reusable tracking redirect handler
  const handleTrackingRedirect = async (request: any, reply: any) => {
    const { slug: linkSlug } = request.params as { slug: string };
    const link = await prisma.affiliateLink.findUnique({
      where: { slug: linkSlug },
      include: {
        organization: { select: { name: true, shopDomain: true, storefrontDomain: true } },
        creator: { select: { creatorCode: true } },
        collection: { select: { handle: true } },
        products: {
          include: { product: { select: { title: true, handle: true, imageUrl: true, price: true } } },
          orderBy: { position: 'asc' },
        },
      },
    });
    if (!link || link.status !== 'ACTIVE' || (link.expiresAt && link.expiresAt <= new Date())) {
      throw new AppError('AFFILIATE_LINK_NOT_FOUND', 'This affiliate link is unavailable.', 404);
    }
    const query = request.query as Record<string, string | undefined>;
    const visitorHash = request.headers['user-agent']
      ? createHash('sha256').update(`${request.headers['user-agent']}|${request.ip}`).digest('hex')
      : null;

    await prisma.affiliateLinkClick.create({
      data: {
        organizationId: link.organizationId,
        linkId: link.id,
        visitorHash,
        referrer: request.headers.referer?.slice(0, 2_000),
        utmSource: query.utm_source?.slice(0, 255),
        utmMedium: query.utm_medium?.slice(0, 255),
        utmCampaign: query.utm_campaign?.slice(0, 255),
      },
    });

    const activeDomain = link.organization.storefrontDomain || link.organization.shopDomain;

    if (link.targetType === 'COLLECTION' && link.collection?.handle) {
      const destination = safeDestination(activeDomain, `/collections/${link.collection.handle}`);
      destination.searchParams.set('mi_link', link.slug);
      destination.searchParams.set('code', link.slug);
      if (link.creatorId) {
        const creatorCode = link.creator?.creatorCode ?? await ensureCreatorCode(prisma, link.creatorId);
        destination.searchParams.set('mi_creator_code', creatorCode);
        destination.searchParams.set('utm_creator_code', creatorCode);
        destination.searchParams.set('ref', creatorCode);
      }
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
        if (query[key]) destination.searchParams.set(key, query[key]!);
      }
      return reply.redirect(destination.toString(), 302);
    }

    if (link.targetType === 'COLLECTION') {
      const creatorCode = link.creatorId ? (link.creator?.creatorCode ?? await ensureCreatorCode(prisma, link.creatorId)) : null;
      const cards = link.products.map((item: any) => {
        const destination = safeDestination(activeDomain, item.product.handle ? `/products/${item.product.handle}` : '/');
        destination.searchParams.set('mi_link', link.slug);
        destination.searchParams.set('code', link.slug);
        if (creatorCode) {
          destination.searchParams.set('mi_creator_code', creatorCode);
          destination.searchParams.set('utm_creator_code', creatorCode);
          destination.searchParams.set('ref', creatorCode);
        }
        for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
          if (query[key]) destination.searchParams.set(key, query[key]!);
        }
        const image = item.product.imageUrl ? `<img src="${escapeHtml(item.product.imageUrl)}" alt="${escapeHtml(item.product.title)}">` : '<div class="image-placeholder">Product</div>';
        return `<a class="product" href="${escapeHtml(destination.toString())}">${image}<h2>${escapeHtml(item.product.title)}</h2><p>${escapeHtml(item.product.price ?? '')}</p><span>View product →</span></a>`;
      }).join('');
      return reply.type('text/html; charset=utf-8').send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(link.organization.name)} picks</title><style>body{margin:0;background:#f8f7ff;color:#191628;font:16px system-ui,sans-serif}main{max-width:1050px;margin:auto;padding:48px 20px}h1{font-size:32px;margin:0 0 8px}.intro{color:#6e6880;margin:0 0 32px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}.product{display:block;background:#fff;color:inherit;text-decoration:none;border:1px solid #e6e2f0;border-radius:16px;overflow:hidden;padding:14px;box-shadow:0 4px 18px #24164d0a}.product:hover{border-color:#7158ef;transform:translateY(-2px)}img,.image-placeholder{width:100%;height:190px;object-fit:cover;border-radius:10px;background:#eee9ff}.image-placeholder{display:grid;place-items:center;color:#756b94}h2{font-size:16px;margin:14px 0 5px}p{margin:0;color:#665d7d;font-weight:600}.product span{display:block;margin-top:14px;color:#6249dd;font-weight:700;font-size:14px}</style></head><body><main><h1>${escapeHtml(link.organization.name)} picks</h1><p class="intro">A curated collection shared by your creator.</p><section class="grid">${cards}</section></main></body></html>`);
    }

    const destination = safeDestination(activeDomain, link.destinationPath);
    destination.searchParams.set('mi_link', link.slug);
    destination.searchParams.set('code', link.slug);
    if (link.creatorId) {
      const creatorCode = link.creator?.creatorCode ?? await ensureCreatorCode(prisma, link.creatorId);
      destination.searchParams.set('mi_creator_code', creatorCode);
      destination.searchParams.set('utm_creator_code', creatorCode);
      destination.searchParams.set('ref', creatorCode);
    }
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      if (query[key]) destination.searchParams.set(key, query[key]!);
    }
    return reply.redirect(destination.toString(), 302);
  };

  app.get('/r/:slug', handleTrackingRedirect);
  app.get('/api/v1/r/:slug', handleTrackingRedirect);

  // Serve client-side Shopify Cart attribution and direct-click tracking script
  const buildTrackingScript = (defaultApiBase?: string) => `(function(){
    try {
      var params = new URLSearchParams(window.location.search);
      var queryCode = params.get('mi_link') || params.get('_mi_link') || params.get('code');
      var creator = params.get('mi_creator_code') || params.get('_mi_creator_code') || params.get('utm_creator_code') || params.get('ref');
      var link = queryCode;

      if (link) {
        sessionStorage.setItem('mi_link', link);
        localStorage.setItem('mi_link', link);

        // Ping MegaInfluencer to record the click if arriving with referral parameter
        var clickKey = 'mi_clk_' + link;
        if (!sessionStorage.getItem(clickKey)) {
          sessionStorage.setItem(clickKey, '1');
          try {
            var scriptEl = document.currentScript || document.querySelector('script[src*="tracking.js"]');
            var apiBase = scriptEl && scriptEl.src ? new URL(scriptEl.src).origin : ${JSON.stringify(defaultApiBase || '')};
            if (apiBase) {
              var clickUrl = apiBase + '/public/affiliate-links/' + encodeURIComponent(link) + '/click?ref=' + encodeURIComponent(document.referrer || '');
              if (navigator.sendBeacon) {
                navigator.sendBeacon(clickUrl);
              } else {
                var img = new Image();
                img.src = clickUrl;
              }
            }
          } catch(e) {}
        }
      } else {
        link = sessionStorage.getItem('mi_link') || localStorage.getItem('mi_link');
      }

      if (creator) {
        sessionStorage.setItem('mi_creator_code', creator);
        localStorage.setItem('mi_creator_code', creator);
      } else {
        creator = sessionStorage.getItem('mi_creator_code') || localStorage.getItem('mi_creator_code');
      }

      if (link || creator) {
        var body = { attributes: {} };
        if (link) body.attributes['mi_link'] = link;
        if (creator) body.attributes['mi_creator_code'] = creator;
        fetch('/cart/update.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).catch(function(){});
      }
    } catch(e) {}
  })();`;

  app.get('/tracking.js', async (request, reply) => {
    const apiBase = config.publicBaseUrl || `${request.protocol}://${request.headers.host}`;
    return reply.type('application/javascript; charset=utf-8').send(buildTrackingScript(apiBase));
  });
  app.get('/api/v1/tracking.js', async (request, reply) => {
    const apiBase = config.publicBaseUrl || `${request.protocol}://${request.headers.host}`;
    return reply.type('application/javascript; charset=utf-8').send(buildTrackingScript(apiBase));
  });
};

/** Shopify order webhook: auto-syncs orders into the database and calculates affiliate commissions */
export const affiliateShopifyWebhookRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;
  app.post('/webhooks/shopify/orders', async (request, reply) => {
    const rawBuffer = Buffer.isBuffer(request.body)
      ? request.body
      : typeof request.body === 'string'
        ? Buffer.from(request.body, 'utf8')
        : Buffer.from(JSON.stringify(request.body || {}), 'utf8');

    const shopifySignature = request.headers['x-shopify-hmac-sha256'];
    const bridgeSignature = request.headers['x-megainfluencer-signature-256'] ?? request.headers['x-megachat-signature-256'];

    // Verify signatures when secret is configured
    if (typeof bridgeSignature === 'string' && config.shopifyBridgeWebhookSecret) {
      try {
        const expected = createHmac('sha256', config.shopifyBridgeWebhookSecret).update(rawBuffer).digest('hex');
        if (expected.length !== bridgeSignature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(bridgeSignature))) {
          app.log.warn({ bridgeSignature, expected }, 'Invalid bridge webhook signature.');
          throw new AppError('WEBHOOK_UNAUTHORIZED', 'Invalid bridge webhook signature.', 401);
        }
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        throw new AppError('WEBHOOK_UNAUTHORIZED', 'Bridge webhook verification failed.', 401);
      }
    } else if (typeof shopifySignature === 'string' && config.shopifyAppSecret) {
      try {
        const expected = createHmac('sha256', config.shopifyAppSecret).update(rawBuffer).digest('base64');
        if (expected.length !== shopifySignature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(shopifySignature))) {
          app.log.warn({ shopifySignature, expected }, 'Invalid shopify webhook signature.');
          throw new AppError('WEBHOOK_UNAUTHORIZED', 'Invalid webhook signature.', 401);
        }
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        throw new AppError('WEBHOOK_UNAUTHORIZED', 'Shopify webhook verification failed.', 401);
      }
    }

    let payload: Record<string, any>;
    let domain = String(request.headers['x-shopify-shop-domain'] ?? '');
    let eventKey = String(request.headers['x-shopify-topic'] ?? '');

    try {
      const parsed = JSON.parse(rawBuffer.toString('utf8'));
      if (parsed && typeof parsed === 'object' && parsed.data && parsed.source === 'shopify') {
        payload = parsed.data;
        eventKey = parsed.eventKey || eventKey;
        domain = String(payload._shopifyMeta?.shop || domain);
      } else if (parsed && typeof parsed === 'object') {
        payload = parsed;
      } else {
        return reply.code(200).send({ ignored: true, reason: 'Invalid JSON payload' });
      }
    } catch {
      return reply.code(200).send({ ignored: true, reason: 'Malformed JSON payload' });
    }

    const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim().toLowerCase();

    // Match store organization by shopDomain or storefrontDomain
    let organization = null;
    if (cleanDomain) {
      organization = await prisma.organization.findFirst({
        where: {
          OR: [
            { shopDomain: { equals: cleanDomain, mode: 'insensitive' } },
            { shopDomain: { contains: cleanDomain, mode: 'insensitive' } },
            { storefrontDomain: { equals: cleanDomain, mode: 'insensitive' } },
            { storefrontDomain: { contains: cleanDomain, mode: 'insensitive' } },
          ],
        },
        select: { id: true, shopDomain: true, storefrontDomain: true },
      });
    }

    // Fallback: If no direct domain match, check single connected store
    if (!organization) {
      const connectedCount = await prisma.organization.count({ where: { connectionStatus: 'CONNECTED' } });
      if (connectedCount === 1) {
        organization = await prisma.organization.findFirst({
          where: { connectionStatus: 'CONNECTED' },
          select: { id: true, shopDomain: true, storefrontDomain: true },
        });
      } else {
        const anyCount = await prisma.organization.count();
        if (anyCount === 1) {
          organization = await prisma.organization.findFirst({
            select: { id: true, shopDomain: true, storefrontDomain: true },
          });
        }
      }
    }

    const shopifyId = String(payload.admin_graphql_api_id ?? payload.id);
    if (!shopifyId || shopifyId === 'undefined' || shopifyId === 'null') {
      return reply.code(200).send({ ignored: true, reason: 'Missing order ID' });
    }

    const name = String(payload.name ?? payload.order_number ?? `#${shopifyId}`);
    const email = payload.email ?? payload.customer?.email ?? null;
    const currency = payload.currency ?? payload.presentment_currency ?? payload.totalPriceSet?.shopMoney?.currencyCode ?? null;
    const total = String(payload.current_total_price ?? payload.total_price ?? payload.total_price_set?.shopMoney?.amount ?? '0');
    const subtotal = Number(payload.current_subtotal_price ?? payload.subtotal_price ?? total ?? 0);
    const financialStatus = payload.financial_status ?? payload.displayFinancialStatus ?? null;
    const fulfillmentStatus = payload.fulfillment_status ?? payload.displayFulfillmentStatus ?? null;
    const processedAt = payload.processed_at ? new Date(payload.processed_at) : (payload.created_at ? new Date(payload.created_at) : new Date());

    // Extract note attributes / customAttributes
    const rawAttributes = Array.isArray(payload.note_attributes)
      ? payload.note_attributes
      : Array.isArray(payload.customAttributes)
        ? payload.customAttributes
        : [];
    const lineItems = Array.isArray(payload.line_items) ? payload.line_items : Array.isArray(payload.lineItems) ? payload.lineItems : [];
    const lineAttributes = lineItems.flatMap((line: any) => Array.isArray(line.properties) ? line.properties : Array.isArray(line.customAttributes) ? line.customAttributes : []);
    const attributionAttributes = [...rawAttributes, ...lineAttributes];

    const getAttr = (key: string) => {
      const found = attributionAttributes.find((item: any) => {
        const k = String(item?.name ?? item?.key ?? '').trim().toLowerCase();
        return k === key.toLowerCase();
      });
      return found?.value ? String(found.value).trim() : null;
    };

    // 1. Direct Attributes
    let linkSlug = getAttr('mi_link') ?? getAttr('_mi_link') ?? getAttr('code') ?? getAttr('link');
    let trackedCreatorCode =
      getAttr('mi_creator_code') ??
      getAttr('_mi_creator_code') ??
      getAttr('utm_creator_code') ??
      getAttr('creator_code') ??
      getAttr('creator') ??
      getAttr('ref');

    // 2. Landing site / Referral URL parameter parsing (Crucial for Buy It Now direct checkout)
    const landingUrl = String(
      payload.customerJourneySummary?.firstVisit?.landingPage ??
      payload.customerJourneySummary?.lastVisit?.landingPage ??
      payload.landing_site ??
      payload.landing_site_ref ??
      payload.referring_site ??
      payload.source_url ??
      ''
    );
    if (landingUrl) {
      if (!linkSlug) {
        const linkMatch = landingUrl.match(/[?&](?:mi_link|_mi_link|code|link|aff|via)=([a-zA-Z0-9_-]+)/i);
        if (linkMatch) linkSlug = linkMatch[1];
      }
      if (!trackedCreatorCode) {
        const codeMatch = landingUrl.match(/[?&](?:mi_creator_code|_mi_creator_code|utm_creator_code|creator_code|creator|ref)=([a-zA-Z0-9_-]+)/i);
        if (codeMatch) trackedCreatorCode = codeMatch[1];
      }
    }

    // 3. Discount Codes / Discount Applications
    const discountCodes: string[] = [
      ...(Array.isArray(payload.discount_codes) ? payload.discount_codes.map((d: any) => String(d.code || '').trim()) : []),
      ...(Array.isArray(payload.discount_applications) ? payload.discount_applications.map((d: any) => String(d.code || d.title || '').trim()) : []),
      ...(Array.isArray(payload.discountApplications) ? payload.discountApplications.map((d: any) => String(d.code || d.title || '').trim()) : []),
      ...(payload.discount_code ? [String(payload.discount_code).trim()] : []),
    ].filter(Boolean);

    // 4. Order Note check
    const noteText = String(payload.note ?? '');
    if (noteText) {
      if (!linkSlug) {
        const noteLinkMatch = noteText.match(/(?:mi_link|_mi_link|code|link)[:=\s]+([a-zA-Z0-9_-]+)/i);
        if (noteLinkMatch) linkSlug = noteLinkMatch[1];
      }
      if (!trackedCreatorCode) {
        const noteCreatorMatch = noteText.match(/(?:mi_creator_code|_mi_creator_code|creator_code|creator|ref)[:=\s]+([a-zA-Z0-9_-]+)/i);
        if (noteCreatorMatch) trackedCreatorCode = noteCreatorMatch[1];
      }
    }

    // Fallback: If organization still not resolved but linkSlug exists, resolve organization from link
    if (!organization && linkSlug) {
      const linkOrg = await prisma.affiliateLink.findFirst({
        where: { slug: String(linkSlug) },
        select: { organization: { select: { id: true, shopDomain: true, storefrontDomain: true } } },
      });
      if (linkOrg?.organization) organization = linkOrg.organization;
    }

    if (!organization) {
      app.log.warn({ domain, cleanDomain, linkSlug }, 'Order webhook received but no matching organization found in database.');
      return reply.code(200).send({ ignored: true, reason: 'Organization not found' });
    }

    // 5. Tags parsing
    const rawTags = payload.tags;
    const tagList = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === 'string'
        ? rawTags.split(',').map((t: string) => t.trim())
        : [];
    const isSampleOrder = tagList.some((t: string) =>
      ['influencersample', 'bartersample', 'sample', 'barter'].includes(t.toLowerCase())
    );

    // Resolve Creator & Link
    let link: any = null;
    let creator: any = null;

    if (linkSlug) {
      link = await prisma.affiliateLink.findFirst({
        where: { slug: String(linkSlug), organizationId: organization.id },
        select: {
          id: true,
          creatorId: true,
          commissionType: true,
          commissionRate: true,
          commissionAmount: true,
          targetType: true,
          creator: { select: { id: true, creatorCode: true, role: true } },
          products: { select: { product: { select: { shopifyId: true } } } },
          collection: { select: { products: { select: { product: { select: { shopifyId: true } } } } } },
        },
      });
      if (link?.creator) {
        creator = link.creator;
        trackedCreatorCode = creator.creatorCode ?? trackedCreatorCode;
      } else if (!link && !trackedCreatorCode) {
        // If no link matched this slug, check if the string is actually a creator's code!
        trackedCreatorCode = String(linkSlug);
      }

      // A collection link only attributes an order when at least one purchased
      // product belongs to that collection. Visitors may browse anywhere, but
      // unrelated purchases are not credited to this link.
      if (link?.targetType === 'COLLECTION') {
        const canonicalId = (value: unknown) => String(value ?? '').split('/').pop();
        const membership = link.collection?.products ?? link.products ?? [];
        const collectionProductIds = new Set(membership.map((item: any) => canonicalId(item.product?.shopifyId)).filter(Boolean));
        if (collectionProductIds.size > 0) {
          const hasCollectionProduct = lineItems.some((item: any) => {
            const orderedProductId = canonicalId(item.product_id ?? item.productId ?? item.product?.id);
            return orderedProductId && collectionProductIds.has(orderedProductId);
          });
          if (!hasCollectionProduct) {
            link = null;
            creator = null;
            trackedCreatorCode = null;
          }
        }
      }
    }

    if (!link && trackedCreatorCode) {
      // First check if trackedCreatorCode is actually an affiliate link slug
      const slugLink = await prisma.affiliateLink.findFirst({
        where: {
          slug: String(trackedCreatorCode),
          organizationId: organization.id,
        },
        select: {
          id: true,
          creatorId: true,
          commissionType: true,
          commissionRate: true,
          commissionAmount: true,
          targetType: true,
          creator: { select: { id: true, creatorCode: true, role: true } },
          products: { select: { product: { select: { shopifyId: true } } } },
          collection: { select: { products: { select: { product: { select: { shopifyId: true } } } } } },
        },
      });
      if (slugLink) {
        link = slugLink;
        creator = slugLink.creator;
        trackedCreatorCode = creator?.creatorCode ?? trackedCreatorCode;
      } else {
        // Prioritize creators assigned to this store first
        if (organization) {
          const assigned = await prisma.storeInfluencerAssignment.findMany({
            where: { organizationId: organization.id },
            include: {
              influencer: {
                select: {
                  id: true,
                  creatorCode: true,
                  role: true,
                  instagramConnection: { select: { username: true } },
                  discountCodes: { where: { organizationId: organization.id }, select: { code: true } },
                },
              },
            },
          });
          const cleanTracked = String(trackedCreatorCode).trim().toLowerCase();
          for (const a of assigned) {
            const inf = a.influencer;
            if (!inf) continue;
            const infCode = inf.creatorCode?.toLowerCase();
            const baseCode = infCode?.replace(/_pro$/i, '').trim();
            const insta = inf.instagramConnection?.username?.toLowerCase();
            const customMatch = inf.discountCodes?.some((d: any) => d.code?.toLowerCase() === cleanTracked);
            if (infCode === cleanTracked || baseCode === cleanTracked || insta === cleanTracked || customMatch) {
              creator = inf;
              break;
            }
          }
        }

        if (!creator) {
          creator = await prisma.user.findFirst({
            where: {
              OR: [
                { creatorCode: { equals: trackedCreatorCode, mode: 'insensitive' } },
                { instagramConnection: { username: { equals: trackedCreatorCode, mode: 'insensitive' } } },
              ],
              role: { in: ['INFLUENCER', 'CUSTOMER'] },
            },
            select: { id: true, creatorCode: true, role: true },
          });
        }

        if (creator) {
          link = await prisma.affiliateLink.findFirst({
            where: { creatorId: creator.id, organizationId: organization.id, status: 'ACTIVE' },
            select: { id: true, creatorId: true, commissionType: true, commissionRate: true, commissionAmount: true },
          });
        }
      }
    }

    if (!link && discountCodes.length > 0) {
      for (const code of discountCodes) {
        const cleanCode = String(code).trim().toLowerCase();
        let matchedCreator: any = null;

        if (organization) {
          const assigned = await prisma.storeInfluencerAssignment.findMany({
            where: { organizationId: organization.id },
            include: {
              influencer: {
                select: {
                  id: true,
                  creatorCode: true,
                  role: true,
                  instagramConnection: { select: { username: true } },
                  discountCodes: { where: { organizationId: organization.id }, select: { code: true } },
                },
              },
            },
          });
          for (const a of assigned) {
            const inf = a.influencer;
            if (!inf) continue;
            const infCode = inf.creatorCode?.toLowerCase();
            const baseCode = infCode?.replace(/_pro$/i, '').trim();
            const insta = inf.instagramConnection?.username?.toLowerCase();
            const customMatch = inf.discountCodes?.some((d: any) => d.code?.toLowerCase() === cleanCode);
            if (infCode === cleanCode || baseCode === cleanCode || insta === cleanCode || customMatch) {
              matchedCreator = inf;
              break;
            }
          }
        }

        if (!matchedCreator) {
          matchedCreator = await prisma.user.findFirst({
            where: {
              OR: [
                { creatorCode: { equals: code, mode: 'insensitive' } },
                { instagramConnection: { username: { equals: code, mode: 'insensitive' } } },
              ],
              role: { in: ['INFLUENCER', 'CUSTOMER'] },
            },
            select: { id: true, creatorCode: true, role: true },
          });
        }

        if (!matchedCreator && organization) {
          const customDisc = await prisma.discountCode.findFirst({
            where: {
              organizationId: organization.id,
              code: { equals: code, mode: 'insensitive' },
            },
            include: { creator: { select: { id: true, creatorCode: true, role: true } } },
          });
          if (customDisc?.creator) {
            matchedCreator = customDisc.creator;
          }
        }

        if (matchedCreator) {
          creator = matchedCreator;
          trackedCreatorCode = creator.creatorCode || code;
          link = await prisma.affiliateLink.findFirst({
            where: { creatorId: creator.id, organizationId: organization.id, status: 'ACTIVE' },
            select: { id: true, creatorId: true, commissionType: true, commissionRate: true, commissionAmount: true },
          });
          break;
        }
      }
    }

    const finalCreatorCode = trackedCreatorCode ?? link?.creator?.creatorCode ?? creator?.creatorCode ?? null;
    const finalLinkId = link?.id ?? null;

    // Check if order already exists in our database and whether attribution is locked
    const existingOrder = await prisma.shopifyOrder.findUnique({
      where: {
        organizationId_shopifyId: {
          organizationId: organization.id,
          shopifyId,
        },
      },
      include: {
        affiliateCommissions: true,
      },
    });

    let effectiveCreatorCode = finalCreatorCode;
    let effectiveLinkId = finalLinkId;
    let effectiveLink = link;
    let effectiveCreator = creator;
    let isLocked = existingOrder?.isAttributionLocked ?? false;
    let attributionMethod = existingOrder?.attributionMethod ?? null;
    let attributionEvidence = existingOrder?.attributionEvidence ?? null;
    let attributionLockedAt = existingOrder?.attributionLockedAt ?? null;
    let tamperFlagged = existingOrder?.tamperFlagged ?? false;
    let tamperDetails = existingOrder?.tamperDetails ?? null;

    if (existingOrder && existingOrder.isAttributionLocked) {
      // ORDER ATTRIBUTION IS LOCKED (Standard Enterprise Protection)
      // Check if external webhook contains a conflicting creator code attempting to steal or reassign this order
      const incomingDiffers = finalCreatorCode && finalCreatorCode.toLowerCase() !== String(existingOrder.creatorCode || '').toLowerCase();

      if (incomingDiffers) {
        tamperFlagged = true;
        tamperDetails = {
          attemptedCreatorCode: finalCreatorCode,
          attemptedLinkId: finalLinkId,
          lockedCreatorCode: existingOrder.creatorCode,
          lockedLinkId: existingOrder.affiliateLinkId,
          detectedAt: new Date().toISOString(),
          eventTopic: eventKey || 'orders/updated',
          reason: 'Incoming external Shopify update attempted to modify attribution for an already locked order.',
        };

        // Write immutable audit trail entry
        await prisma.orderAttributionAudit.create({
          data: {
            organizationId: organization.id,
            shopifyOrderId: existingOrder.id,
            action: 'TAMPER_ATTEMPT_BLOCKED',
            actor: 'WEBHOOK',
            fromCode: existingOrder.creatorCode,
            toCode: finalCreatorCode,
            reason: `Blocked external Shopify update attempting to re-attribute locked order from @${existingOrder.creatorCode || 'None'} to @${finalCreatorCode}.`,
            metadata: {
              incomingDiscountCodes: discountCodes,
              incomingNote: noteText,
              incomingAttributes: rawAttributes,
            },
          },
        }).catch((err: any) => app.log.warn({ err }, 'Failed to record attribution audit log'));

        app.log.warn(
          { shopifyId, lockedCode: existingOrder.creatorCode, attemptedCode: finalCreatorCode },
          'Security Alert: Blocked external attempt to reassign locked order attribution.'
        );
      }

      // Preserve the locked attribution!
      effectiveCreatorCode = existingOrder.creatorCode;
      effectiveLinkId = existingOrder.affiliateLinkId;

      // Re-hydrate the locked link & creator so commission ledger stays with the legitimate owner
      if (effectiveLinkId) {
        effectiveLink = await prisma.affiliateLink.findUnique({
          where: { id: effectiveLinkId },
          include: { creator: true, products: { select: { product: { select: { shopifyId: true } } } }, collection: { select: { products: { select: { product: { select: { shopifyId: true } } } } } } },
        });
        if (effectiveLink?.creator) effectiveCreator = effectiveLink.creator;
      } else if (effectiveCreatorCode) {
        const cleanLockedCode = String(effectiveCreatorCode).trim().replace(/^@/, '');
        effectiveCreator = await prisma.user.findFirst({
          where: {
            OR: [
              { creatorCode: { equals: cleanLockedCode, mode: 'insensitive' } },
              { creatorCode: { equals: `@${cleanLockedCode}`, mode: 'insensitive' } },
              { instagramConnection: { username: { equals: cleanLockedCode, mode: 'insensitive' } } },
              { discountCodes: { some: { organizationId: organization.id, code: { equals: cleanLockedCode, mode: 'insensitive' } } } },
            ],
          },
        });
        if (effectiveCreator && !effectiveLink) {
          effectiveLink = await prisma.affiliateLink.findFirst({
            where: { creatorId: effectiveCreator.id, organizationId: organization.id, status: 'ACTIVE' },
            select: { id: true, creatorId: true, commissionType: true, commissionRate: true, commissionAmount: true },
          });
        }
      }
    } else {
      // Order is new or was not yet locked: Lock it upon first verified attribution!
      if (finalCreatorCode || finalLinkId) {
        isLocked = true;
        attributionLockedAt = new Date();
        attributionMethod = discountCodes.length > 0
          ? 'DISCOUNT_CODE'
          : (linkSlug ? 'AFFILIATE_LINK' : (trackedCreatorCode ? 'CHECKOUT_ATTRIBUTE' : 'CUSTOMER_JOURNEY'));
        attributionEvidence = {
          discountCodes,
          linkSlug,
          trackedCreatorCode,
          landingUrl: landingUrl || null,
          noteText: noteText || null,
          lockedAt: attributionLockedAt.toISOString(),
        };
      }
    }

    // Always upsert the Shopify Order in database so orders stay synced in real time
    const order = await prisma.shopifyOrder.upsert({
      where: {
        organizationId_shopifyId: {
          organizationId: organization.id,
          shopifyId,
        },
      },
      create: {
        organizationId: organization.id,
        shopifyId,
        name,
        email,
        currency,
        total,
        financialStatus,
        fulfillmentStatus,
        processedAt,
        creatorCode: effectiveCreatorCode,
        affiliateLinkId: effectiveLinkId,
        isAttributionLocked: isLocked,
        attributionMethod,
        attributionEvidence: attributionEvidence as Prisma.InputJsonValue,
        attributionLockedAt,
        tamperFlagged,
        tamperDetails: tamperDetails as Prisma.InputJsonValue,
        payload: payload as Prisma.InputJsonValue,
      },
      update: {
        name,
        email,
        currency,
        total,
        financialStatus,
        fulfillmentStatus,
        processedAt,
        creatorCode: effectiveCreatorCode,
        affiliateLinkId: effectiveLinkId,
        isAttributionLocked: isLocked,
        attributionMethod,
        attributionEvidence: attributionEvidence as Prisma.InputJsonValue,
        attributionLockedAt,
        tamperFlagged,
        tamperDetails: tamperDetails as Prisma.InputJsonValue,
        payload: payload as Prisma.InputJsonValue,
      },
    });

    if (!existingOrder && isLocked) {
      await prisma.orderAttributionAudit.create({
        data: {
          organizationId: organization.id,
          shopifyOrderId: order.id,
          action: 'INITIAL_LOCK',
          actor: 'SYSTEM_CHECKOUT',
          toCreatorId: effectiveCreator?.id ?? null,
          toCode: effectiveCreatorCode,
          reason: `Attribution locked at point-of-sale via ${attributionMethod}.`,
          metadata: attributionEvidence as Prisma.InputJsonValue,
        },
      }).catch((err: any) => app.log.warn({ err }, 'Failed to record initial attribution lock audit'));
    }

    const isCancelledOrRefunded = Boolean(
      payload.cancelled_at ||
      String(financialStatus).toLowerCase() === 'refunded' ||
      String(financialStatus).toLowerCase() === 'voided'
    );

    const assignment = effectiveCreator ? await prisma.storeInfluencerAssignment.findUnique({
      where: { organizationId_influencerId: { organizationId: organization.id, influencerId: effectiveCreator.id } },
      select: { compensationMode: true, autoCommission: true },
    }) : null;
    const isBarter = assignment?.compensationMode === 'BARTER';
    const isAutoCommission = (assignment as any)?.autoCommission ?? true;

    // Auto-create affiliate link if creator is matched but has no link yet and NOT on Barter deal
    if (effectiveCreator && !effectiveLink && !isSampleOrder && !isBarter) {
      const cleanCreatorSlug = (effectiveCreator.creatorCode || effectiveCreator.id.slice(-6)).toLowerCase().replace(/^@/, '');
      effectiveLink = await prisma.affiliateLink.create({
        data: {
          organizationId: organization.id,
          creatorId: effectiveCreator.id,
          targetType: 'STORE',
          destinationPath: '/',
          commissionRate: 10,
          slug: `link_${cleanCreatorSlug}_${Date.now().toString(36).slice(-4)}`,
        },
        select: { id: true, creatorId: true, commissionRate: true, commissionType: true, commissionAmount: true },
      });
      await prisma.shopifyOrder.update({
        where: { id: order.id },
        data: { affiliateLinkId: effectiveLink.id },
      });
    }

    // Calculate commission using centralized engine
    if (effectiveLink && effectiveCreator && !isSampleOrder) {
      const storeConfig = await prisma.storeReferralConfig.findUnique({
        where: { organizationId: organization.id },
        select: {
          multiProductCommissionMode: true,
          fallbackCommissionRate: true,
          fixedTokensEnabled: true,
          percentageEnabled: true,
          fixedTokensPerOrder: true,
        },
      }).catch(() => null);

      const assignedProductRows = await prisma.productInfluencerAssignment.findMany({
        where: { organizationId: organization.id, influencerId: effectiveCreator.id },
        select: { product: { select: { shopifyId: true } } },
      });
      const canonicalId = (val: unknown) => String(val ?? '').split('/').pop() || '';
      const assignedProductSet = new Set<string>();
      for (const p of assignedProductRows) {
        const cid = canonicalId(p.product?.shopifyId);
        if (cid) assignedProductSet.add(cid);
      }
      if (effectiveLink?.productId) {
        const cid = canonicalId(effectiveLink.productId);
        if (cid) assignedProductSet.add(cid);
      }
      if (Array.isArray(effectiveLink?.products)) {
        for (const lp of effectiveLink.products) {
          const cid = canonicalId(lp.product?.shopifyId);
          if (cid) assignedProductSet.add(cid);
        }
      }

      const calc = calculateOrderCommission(
        order,
        effectiveLink,
        storeConfig,
        assignedProductSet,
        isAutoCommission,
        isBarter
      );

      await prisma.affiliateCommission.upsert({
        where: { shopifyOrderId: order.id },
        create: {
          organizationId: organization.id,
          linkId: effectiveLink.id,
          creatorId: effectiveCreator.id,
          shopifyOrderId: order.id,
          orderAmount: Number(order.total || 0),
          commissionType: calc.commissionType,
          commissionRate: calc.commissionRate,
          amount: calc.amount,
          status: calc.status,
        },
        update: {
          linkId: effectiveLink.id,
          creatorId: effectiveCreator.id,
          orderAmount: Number(order.total || 0),
          commissionType: calc.commissionType,
          commissionRate: calc.commissionRate,
          amount: calc.amount,
          status: calc.status,
        },
      });

      return reply.code(200).send({ synced: true, attributed: true, orderId: order.id });
    } else if (isCancelledOrRefunded) {
      await prisma.affiliateCommission.updateMany({
        where: { shopifyOrderId: order.id },
        data: { status: 'REVERSED' },
      });
    }

    return reply.code(200).send({ synced: true, attributed: false, orderId: order.id });
  });
};
