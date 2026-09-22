import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config } from '../../config/env.js';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';

const createLinkSchema = z.object({
  creatorId: z.string().min(1).optional().nullable(), productId: z.string().min(1).optional().nullable(),
  commissionRate: z.coerce.number().min(0).max(100).default(10), expiresAt: z.coerce.date().optional().nullable(),
});
const updateLinkSchema = z.object({ status: z.enum(['ACTIVE', 'PAUSED']).optional(), expiresAt: z.coerce.date().optional().nullable() });

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
function asLink(row: any, baseUrl: string) {
  const clicks = Number(row._count?.clicks ?? 0);
  const commissions = (row.commissions ?? []).filter((commission: any) => commission.status !== 'REVERSED');
  const orders = commissions.length;
  const revenue = commissions.reduce((sum: number, commission: any) => sum + Number(commission.orderAmount), 0);
  const storeCredits = row.creatorId ? 0 : commissions.reduce((sum: number, commission: any) => sum + Number(commission.amount), 0);
  return { id: row.id, creatorId: row.creatorId, creator: row.creator?.displayName ?? null, productId: row.productId, product: row.product?.title ?? null, slug: row.slug, url: `${baseUrl}/r/${row.slug}`, targetType: row.targetType, commissionRate: Number(row.commissionRate), status: row.status, expiresAt: row.expiresAt, clicks, orders, revenue, storeCredits, conversion: clicks ? orders / clicks : 0, createdAt: row.createdAt };
}

export const affiliateLinkRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;
  app.get('/store/affiliate-links', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']); const organization = await organizationFor(app, actor.userId);
    const query = request.query as { search?: string; status?: 'ACTIVE' | 'PAUSED' };
    const rows = await prisma.affiliateLink.findMany({
      where: { organizationId: organization.id, ...(query.status ? { status: query.status } : {}), ...(query.search ? { OR: [{ slug: { contains: query.search, mode: 'insensitive' } }, { creator: { displayName: { contains: query.search, mode: 'insensitive' } } }, { product: { title: { contains: query.search, mode: 'insensitive' } } }] } : {}) },
      include: { creator: { select: { displayName: true } }, product: { select: { title: true } }, _count: { select: { clicks: true } }, commissions: { select: { orderAmount: true, status: true } } }, orderBy: { createdAt: 'desc' },
    });
    const baseUrl = config.publicBaseUrl ?? `http://${request.headers.host}`;
    return { links: rows.map((row: any) => asLink(row, baseUrl)) };
  });

  app.post('/store/affiliate-links', async (request, reply) => {
    const actor = requireRole(request, ['STORE_OWNER']); const organization = await organizationFor(app, actor.userId); const input = createLinkSchema.parse(request.body);
    if (input.creatorId) {
      const assigned = await prisma.storeInfluencerAssignment.findUnique({ where: { organizationId_influencerId: { organizationId: organization.id, influencerId: input.creatorId } } });
      if (!assigned) throw new AppError('CREATOR_NOT_ASSIGNED', 'Choose a creator assigned to this store.', 422);
    }
    const product = input.productId ? await prisma.shopifyProduct.findFirst({ where: { id: input.productId, organizationId: organization.id }, select: { id: true, handle: true } }) : null;
    if (input.productId && !product) throw new AppError('PRODUCT_NOT_FOUND', 'The selected product does not belong to this store.', 422);
    const link = await prisma.affiliateLink.create({ data: { organizationId: organization.id, creatorId: input.creatorId, productId: product?.id, targetType: product ? 'PRODUCT' : 'STORE', destinationPath: product?.handle ? `/products/${product.handle}` : '/', commissionRate: input.commissionRate, expiresAt: input.expiresAt, slug: slug() }, include: { creator: { select: { displayName: true } }, product: { select: { title: true } }, _count: { select: { clicks: true } }, commissions: { select: { orderAmount: true, status: true } } } });
    const baseUrl = config.publicBaseUrl ?? `http://${request.headers.host}`;
    return reply.code(201).send({ link: asLink(link, baseUrl) });
  });

  app.patch('/store/affiliate-links/:linkId', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']); const organization = await organizationFor(app, actor.userId); const { linkId } = request.params as { linkId: string }; const input = updateLinkSchema.parse(request.body);
    const existing = await prisma.affiliateLink.findFirst({ where: { id: linkId, organizationId: organization.id } }); if (!existing) throw new AppError('AFFILIATE_LINK_NOT_FOUND', 'Affiliate link not found.', 404);
    const link = await prisma.affiliateLink.update({ where: { id: linkId }, data: input, include: { creator: { select: { displayName: true } }, product: { select: { title: true } }, _count: { select: { clicks: true } }, commissions: { select: { orderAmount: true, status: true } } } });
    const baseUrl = config.publicBaseUrl ?? `http://${request.headers.host}`; return { link: asLink(link, baseUrl) };
  });

};

export const affiliateTrackingRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;
  app.get('/r/:slug', async (request, reply) => {
    const { slug: linkSlug } = request.params as { slug: string }; const link = await prisma.affiliateLink.findUnique({ where: { slug: linkSlug }, include: { organization: { select: { shopDomain: true } } } });
    if (!link || link.status !== 'ACTIVE' || (link.expiresAt && link.expiresAt <= new Date())) throw new AppError('AFFILIATE_LINK_NOT_FOUND', 'This affiliate link is unavailable.', 404);
    const query = request.query as Record<string, string | undefined>; const visitorHash = request.headers['user-agent'] ? createHash('sha256').update(`${request.headers['user-agent']}|${request.ip}`).digest('hex') : null;
    await prisma.affiliateLinkClick.create({ data: { organizationId: link.organizationId, linkId: link.id, visitorHash, referrer: request.headers.referer?.slice(0, 2_000), utmSource: query.utm_source?.slice(0, 255), utmMedium: query.utm_medium?.slice(0, 255), utmCampaign: query.utm_campaign?.slice(0, 255) } });
    const destination = safeDestination(link.organization.shopDomain, link.destinationPath);
    destination.searchParams.set('mi_link', link.slug);
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) if (query[key]) destination.searchParams.set(key, query[key]!);
    return reply.redirect(destination.toString(), 302);
  });
};

/** Shopify should POST order payloads here after the storefront writes `mi_link` into cart attributes. */
export const affiliateShopifyWebhookRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;
  app.post('/webhooks/shopify/orders', async (request, reply) => {
    const raw = request.body as Buffer; const shopifySignature = request.headers['x-shopify-hmac-sha256']; const bridgeSignature = request.headers['x-megainfluencer-signature-256'] ?? request.headers['x-megachat-signature-256'];
    let payload: Record<string, any>; let domain: string;
    if (typeof bridgeSignature === 'string' && config.shopifyBridgeWebhookSecret) {
      const expected = createHmac('sha256', config.shopifyBridgeWebhookSecret).update(raw).digest('hex');
      if (expected.length !== bridgeSignature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(bridgeSignature))) throw new AppError('WEBHOOK_UNAUTHORIZED', 'Invalid bridge webhook signature.', 401);
      const wrapped = JSON.parse(raw.toString('utf8')) as { eventKey?: string; data?: Record<string, any> };
      if (!['shopify:order_created', 'shopify:order_paid', 'shopify:order_updated', 'shopify:order_cancelled'].includes(wrapped.eventKey ?? '') || !wrapped.data) return reply.code(200).send({ ignored: true });
      payload = wrapped.data; domain = String(payload._shopifyMeta?.shop ?? request.headers['x-shopify-shop-domain'] ?? '');
    } else {
      if (!config.shopifyAppSecret || typeof shopifySignature !== 'string') throw new AppError('WEBHOOK_UNAUTHORIZED', 'Invalid webhook signature.', 401);
      const expected = createHmac('sha256', config.shopifyAppSecret).update(raw).digest('base64');
      if (expected.length !== shopifySignature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(shopifySignature))) throw new AppError('WEBHOOK_UNAUTHORIZED', 'Invalid webhook signature.', 401);
      payload = JSON.parse(raw.toString('utf8')) as Record<string, any>; domain = String(request.headers['x-shopify-shop-domain'] ?? '');
    }
    domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const organization = await app.prisma.organization.findFirst({ where: { shopDomain: { equals: domain, mode: 'insensitive' } }, select: { id: true } }); if (!organization) return reply.code(200).send({ ignored: true });
    const attributes = Array.isArray(payload.note_attributes) ? payload.note_attributes : []; const linkSlug = attributes.find((item: any) => item.name === 'mi_link')?.value;
    if (!linkSlug) return reply.code(200).send({ ignored: true });
    const link = await app.prisma.affiliateLink.findFirst({ where: { slug: String(linkSlug), organizationId: organization.id }, select: { id: true, creatorId: true, commissionRate: true } }); if (!link) return reply.code(200).send({ ignored: true });
    const shopifyId = String(payload.admin_graphql_api_id ?? payload.id); const total = Number(payload.current_subtotal_price ?? payload.subtotal_price ?? 0);
    const order = await app.prisma.shopifyOrder.upsert({ where: { organizationId_shopifyId: { organizationId: organization.id, shopifyId } }, create: { organizationId: organization.id, shopifyId, name: String(payload.name ?? payload.order_number ?? shopifyId), email: payload.email ?? null, currency: payload.currency ?? null, total: String(payload.current_total_price ?? payload.total_price ?? total), financialStatus: payload.financial_status ?? null, fulfillmentStatus: payload.fulfillment_status ?? null, processedAt: payload.processed_at ? new Date(payload.processed_at) : null, payload: payload as Prisma.InputJsonValue }, update: { payload: payload as Prisma.InputJsonValue, total: String(payload.current_total_price ?? payload.total_price ?? total), financialStatus: payload.financial_status ?? null, fulfillmentStatus: payload.fulfillment_status ?? null } });
    const status = payload.cancelled_at || payload.financial_status === 'refunded' ? 'REVERSED' : 'PENDING';
    await app.prisma.affiliateCommission.upsert({ where: { shopifyOrderId: order.id }, create: { organizationId: organization.id, linkId: link.id, creatorId: link.creatorId, shopifyOrderId: order.id, orderAmount: total, commissionRate: link.commissionRate, amount: total * Number(link.commissionRate) / 100, status }, update: { status } });
    return reply.code(200).send({ attributed: true });
  });
};
