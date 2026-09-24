import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config } from '../../config/env.js';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ensureCreatorCode } from '../../shared/creator-code.js';

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
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
}
function asLink(row: any, baseUrl: string) {
  const clicks = Number(row._count?.clicks ?? 0);
  const commissions = (row.commissions ?? []).filter((commission: any) => commission.status !== 'REVERSED');
  const orders = commissions.length;
  const revenue = commissions.reduce((sum: number, commission: any) => sum + Number(commission.orderAmount), 0);
  const storeCredits = row.creatorId ? 0 : commissions.reduce((sum: number, commission: any) => sum + Number(commission.amount), 0);
  return { id: row.id, creatorId: row.creatorId, creator: row.creator?.displayName ?? null, creatorCode: row.creator?.creatorCode ?? null, productId: row.productId, product: row.product?.title ?? null, slug: row.slug, url: `${baseUrl}/r/${row.slug}`, targetType: row.targetType, commissionRate: Number(row.commissionRate), status: row.status, expiresAt: row.expiresAt, clicks, orders, revenue, storeCredits, conversion: clicks ? orders / clicks : 0, createdAt: row.createdAt };
}

export const affiliateLinkRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;
  app.get('/store/affiliate-links', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']); const organization = await organizationFor(app, actor.userId);
    const query = request.query as { search?: string; status?: 'ACTIVE' | 'PAUSED' };
    const rows = await prisma.affiliateLink.findMany({
      where: { organizationId: organization.id, ...(query.status ? { status: query.status } : {}), ...(query.search ? { OR: [{ slug: { contains: query.search, mode: 'insensitive' } }, { creator: { displayName: { contains: query.search, mode: 'insensitive' } } }, { creator: { creatorCode: { contains: query.search, mode: 'insensitive' } } }, { product: { title: { contains: query.search, mode: 'insensitive' } } }] } : {}) },
      include: { creator: { select: { displayName: true, creatorCode: true } }, product: { select: { title: true } }, _count: { select: { clicks: true } }, commissions: { select: { orderAmount: true, status: true } } }, orderBy: { createdAt: 'desc' },
    });
    const baseUrl = config.publicBaseUrl ?? `http://${request.headers.host}`;
    return { links: rows.map((row: any) => asLink(row, baseUrl)) };
  });

  app.post('/store/affiliate-links', async (request, reply) => {
    const actor = requireRole(request, ['STORE_OWNER']); const organization = await organizationFor(app, actor.userId); const input = createLinkSchema.parse(request.body);
    if (input.creatorId) {
      const assigned = await prisma.storeInfluencerAssignment.findUnique({ where: { organizationId_influencerId: { organizationId: organization.id, influencerId: input.creatorId } } });
      if (!assigned) throw new AppError('CREATOR_NOT_ASSIGNED', 'Choose a creator assigned to this store.', 422);
      await ensureCreatorCode(prisma, input.creatorId);
    }
    const product = input.productId ? await prisma.shopifyProduct.findFirst({ where: { id: input.productId, organizationId: organization.id }, select: { id: true, handle: true } }) : null;
    if (input.productId && !product) throw new AppError('PRODUCT_NOT_FOUND', 'The selected product does not belong to this store.', 422);
    const link = await prisma.affiliateLink.create({ data: { organizationId: organization.id, creatorId: input.creatorId, productId: product?.id, targetType: product ? 'PRODUCT' : 'STORE', destinationPath: product?.handle ? `/products/${product.handle}` : '/', commissionRate: input.commissionRate, expiresAt: input.expiresAt, slug: slug() }, include: { creator: { select: { displayName: true, creatorCode: true } }, product: { select: { title: true } }, _count: { select: { clicks: true } }, commissions: { select: { orderAmount: true, status: true } } } });
    const baseUrl = config.publicBaseUrl ?? `http://${request.headers.host}`;
    return reply.code(201).send({ link: asLink(link, baseUrl) });
  });

  app.patch('/store/affiliate-links/:linkId', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']); const organization = await organizationFor(app, actor.userId); const { linkId } = request.params as { linkId: string }; const input = updateLinkSchema.parse(request.body);
    const existing = await prisma.affiliateLink.findFirst({ where: { id: linkId, organizationId: organization.id } }); if (!existing) throw new AppError('AFFILIATE_LINK_NOT_FOUND', 'Affiliate link not found.', 404);
    const link = await prisma.affiliateLink.update({ where: { id: linkId }, data: input, include: { creator: { select: { displayName: true, creatorCode: true } }, product: { select: { title: true } }, _count: { select: { clicks: true } }, commissions: { select: { orderAmount: true, status: true } } } });
    const baseUrl = config.publicBaseUrl ?? `http://${request.headers.host}`; return { link: asLink(link, baseUrl) };
  });

  app.get('/influencer/affiliate-links', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const query = request.query as { search?: string; storeId?: string };
    const rows = await prisma.affiliateLink.findMany({
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
        organization: { select: { id: true, name: true, slug: true } },
        product: { select: { id: true, title: true, imageUrl: true, price: true } },
        products: { include: { product: { select: { id: true, title: true, imageUrl: true, price: true } } }, orderBy: { position: 'asc' } },
        _count: { select: { clicks: true } },
        commissions: { select: { orderAmount: true, amount: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const baseUrl = config.publicBaseUrl ?? `http://${request.headers.host}`;
    return {
      links: rows.map((row: any) => {
        const clicks = Number(row._count?.clicks ?? 0);
        const allCommissions = row.commissions ?? [];
        const commissions = allCommissions.filter((commission: any) => commission.status !== 'REVERSED');
        const orders = allCommissions.length;
        const revenue = commissions.reduce((sum: number, commission: any) => sum + Number(commission.orderAmount), 0);
        const earnings = commissions.reduce((sum: number, commission: any) => sum + Number(commission.amount), 0);

        return {
          id: row.id,
          storeId: row.organizationId,
          storeName: row.organization?.name ?? 'Store',
          storeSlug: row.organization?.slug ?? 'store',
          productId: row.productId,
          productTitle: row.product?.title ?? null,
          productImage: row.product?.imageUrl ?? null,
          productPrice: row.product?.price ?? null,
          products: (row.products ?? []).map((item: any) => ({ id: item.product.id, title: item.product.title, imageUrl: item.product.imageUrl, price: item.product.price })),
          productCount: row.products?.length ?? 0,
          slug: row.slug,
          url: `${baseUrl}/r/${row.slug}`,
          targetType: row.targetType,
          commissionRate: Number(row.commissionRate),
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
      select: { id: true, shopDomain: true, name: true, slug: true },
    });
    if (!organization) throw new AppError('STORE_NOT_FOUND', 'Store not found.', 404);

    const assigned = await prisma.storeInfluencerAssignment.findUnique({
      where: { organizationId_influencerId: { organizationId: organization.id, influencerId: actor.userId } },
    });
    if (!assigned) throw new AppError('NOT_ASSIGNED_TO_STORE', 'You are not assigned to this store.', 403);

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
        organization: { select: { id: true, name: true, slug: true } },
        product: { select: { id: true, title: true, imageUrl: true, price: true } },
        products: { include: { product: { select: { id: true, title: true, imageUrl: true, price: true } } }, orderBy: { position: 'asc' } },
        _count: { select: { clicks: true } },
        commissions: { select: { orderAmount: true, amount: true, status: true } },
      },
    });

    const baseUrl = config.publicBaseUrl ?? `http://${request.headers.host}`;
    return reply.code(201).send({
      link: {
        id: link.id,
        storeId: link.organizationId,
        storeName: link.organization?.name ?? 'Store',
        storeSlug: link.organization?.slug ?? 'store',
        productId: link.productId,
        productTitle: link.product?.title ?? null,
        productImage: link.product?.imageUrl ?? null,
        productPrice: link.product?.price ?? null,
        products: (link.products ?? []).map((item: any) => ({ id: item.product.id, title: item.product.title, imageUrl: item.product.imageUrl, price: item.product.price })),
        productCount: link.products?.length ?? 0,
        slug: link.slug,
        url: `${baseUrl}/r/${link.slug}`,
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
  app.get('/r/:slug', async (request, reply) => {
    const { slug: linkSlug } = request.params as { slug: string }; const link = await prisma.affiliateLink.findUnique({ where: { slug: linkSlug }, include: { organization: { select: { name: true, shopDomain: true } }, creator: { select: { creatorCode: true } }, products: { include: { product: { select: { title: true, handle: true, imageUrl: true, price: true } } }, orderBy: { position: 'asc' } } } });
    if (!link || link.status !== 'ACTIVE' || (link.expiresAt && link.expiresAt <= new Date())) throw new AppError('AFFILIATE_LINK_NOT_FOUND', 'This affiliate link is unavailable.', 404);
    const query = request.query as Record<string, string | undefined>; const visitorHash = request.headers['user-agent'] ? createHash('sha256').update(`${request.headers['user-agent']}|${request.ip}`).digest('hex') : null;
    await prisma.affiliateLinkClick.create({ data: { organizationId: link.organizationId, linkId: link.id, visitorHash, referrer: request.headers.referer?.slice(0, 2_000), utmSource: query.utm_source?.slice(0, 255), utmMedium: query.utm_medium?.slice(0, 255), utmCampaign: query.utm_campaign?.slice(0, 255) } });
    if (link.targetType === 'COLLECTION') {
      const creatorCode = link.creatorId ? (link.creator?.creatorCode ?? await ensureCreatorCode(prisma, link.creatorId)) : null;
      const cards = link.products.map((item: any) => {
        const destination = safeDestination(link.organization.shopDomain, item.product.handle ? `/products/${item.product.handle}` : '/');
        destination.searchParams.set('mi_link', link.slug);
        if (creatorCode) { destination.searchParams.set('mi_creator_code', creatorCode); destination.searchParams.set('utm_creator_code', creatorCode); }
        for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) if (query[key]) destination.searchParams.set(key, query[key]!);
        const image = item.product.imageUrl ? `<img src="${escapeHtml(item.product.imageUrl)}" alt="${escapeHtml(item.product.title)}">` : '<div class="image-placeholder">Product</div>';
        return `<a class="product" href="${escapeHtml(destination.toString())}">${image}<h2>${escapeHtml(item.product.title)}</h2><p>${escapeHtml(item.product.price ?? '')}</p><span>View product →</span></a>`;
      }).join('');
      return reply.type('text/html; charset=utf-8').send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(link.organization.name)} picks</title><style>body{margin:0;background:#f8f7ff;color:#191628;font:16px system-ui,sans-serif}main{max-width:1050px;margin:auto;padding:48px 20px}h1{font-size:32px;margin:0 0 8px}.intro{color:#6e6880;margin:0 0 32px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}.product{display:block;background:#fff;color:inherit;text-decoration:none;border:1px solid #e6e2f0;border-radius:16px;overflow:hidden;padding:14px;box-shadow:0 4px 18px #24164d0a}.product:hover{border-color:#7158ef;transform:translateY(-2px)}img,.image-placeholder{width:100%;height:190px;object-fit:cover;border-radius:10px;background:#eee9ff}.image-placeholder{display:grid;place-items:center;color:#756b94}h2{font-size:16px;margin:14px 0 5px}p{margin:0;color:#665d7d;font-weight:600}.product span{display:block;margin-top:14px;color:#6249dd;font-weight:700;font-size:14px}</style></head><body><main><h1>${escapeHtml(link.organization.name)} picks</h1><p class="intro">A curated collection shared by your creator.</p><section class="grid">${cards}</section></main></body></html>`);
    }
    const destination = safeDestination(link.organization.shopDomain, link.destinationPath);
    destination.searchParams.set('mi_link', link.slug);
    if (link.creatorId) {
      const creatorCode = link.creator?.creatorCode ?? await ensureCreatorCode(prisma, link.creatorId);
      destination.searchParams.set('mi_creator_code', creatorCode);
      destination.searchParams.set('utm_creator_code', creatorCode);
    }
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) if (query[key]) destination.searchParams.set(key, query[key]!);
    return reply.redirect(destination.toString(), 302);
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

    // Match store organization
    let organization = null;
    if (cleanDomain) {
      organization = await prisma.organization.findFirst({
        where: {
          OR: [
            { shopDomain: { equals: cleanDomain, mode: 'insensitive' } },
            { shopDomain: { contains: cleanDomain, mode: 'insensitive' } },
          ],
        },
        select: { id: true, shopDomain: true },
      });
    }

    // Fallback: If no direct domain match, check single connected store
    if (!organization) {
      const connectedCount = await prisma.organization.count({ where: { connectionStatus: 'CONNECTED' } });
      if (connectedCount === 1) {
        organization = await prisma.organization.findFirst({
          where: { connectionStatus: 'CONNECTED' },
          select: { id: true, shopDomain: true },
        });
      } else {
        const anyCount = await prisma.organization.count();
        if (anyCount === 1) {
          organization = await prisma.organization.findFirst({
            select: { id: true, shopDomain: true },
          });
        }
      }
    }

    if (!organization) {
      app.log.warn({ domain, cleanDomain }, 'Order webhook received but no matching organization found in database.');
      return reply.code(200).send({ ignored: true, reason: 'Organization not found' });
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
    let linkSlug = getAttr('mi_link') ?? getAttr('_mi_link');
    let trackedCreatorCode =
      getAttr('mi_creator_code') ??
      getAttr('_mi_creator_code') ??
      getAttr('utm_creator_code') ??
      getAttr('creator_code') ??
      getAttr('creator');

    // 2. Landing site / Referral URL parameter parsing (Crucial for Buy It Now direct checkout)
    const landingUrl = String(payload.landing_site ?? payload.landing_site_ref ?? payload.referring_site ?? payload.source_url ?? '');
    if (landingUrl) {
      if (!linkSlug) {
        const linkMatch = landingUrl.match(/[?&](?:mi_link|_mi_link)=([a-zA-Z0-9_-]+)/i);
        if (linkMatch) linkSlug = linkMatch[1];
      }
      if (!trackedCreatorCode) {
        const codeMatch = landingUrl.match(/[?&](?:mi_creator_code|_mi_creator_code|utm_creator_code|creator)=([a-zA-Z0-9_-]+)/i);
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

    // 4. Tags parsing
    const rawTags = payload.tags;
    const tagList = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === 'string'
      ? rawTags.split(',').map((t: string) => t.trim())
      : [];
    const isSampleOrder = tagList.includes('InfluencerSample');

    // Resolve Creator & Link
    let link: any = null;
    let creator: any = null;

    if (linkSlug) {
      link = await prisma.affiliateLink.findFirst({
        where: { slug: String(linkSlug), organizationId: organization.id },
        select: { id: true, creatorId: true, commissionRate: true, creator: { select: { id: true, creatorCode: true } } },
      });
      if (link?.creator) {
        creator = link.creator;
        trackedCreatorCode = creator.creatorCode ?? trackedCreatorCode;
      }
    }

    if (!link && trackedCreatorCode) {
      creator = await prisma.user.findFirst({
        where: {
          creatorCode: { equals: trackedCreatorCode, mode: 'insensitive' },
          role: 'INFLUENCER',
        },
        select: { id: true, creatorCode: true },
      });
      if (creator) {
        link = await prisma.affiliateLink.findFirst({
          where: { creatorId: creator.id, organizationId: organization.id, status: 'ACTIVE' },
          select: { id: true, creatorId: true, commissionRate: true },
        });
      }
    }

    if (!link && discountCodes.length > 0) {
      for (const code of discountCodes) {
        const matchedCreator = await prisma.user.findFirst({
          where: { creatorCode: { equals: code, mode: 'insensitive' }, role: 'INFLUENCER' },
          select: { id: true, creatorCode: true },
        });
        if (matchedCreator) {
          creator = matchedCreator;
          trackedCreatorCode = creator.creatorCode;
          link = await prisma.affiliateLink.findFirst({
            where: { creatorId: creator.id, organizationId: organization.id, status: 'ACTIVE' },
            select: { id: true, creatorId: true, commissionRate: true },
          });
          break;
        }
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
        creatorCode: trackedCreatorCode ?? null,
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
        creatorCode: trackedCreatorCode ?? null,
        payload: payload as Prisma.InputJsonValue,
      },
    });

    const isCancelledOrRefunded = Boolean(
      payload.cancelled_at ||
      String(financialStatus).toLowerCase() === 'refunded' ||
      String(financialStatus).toLowerCase() === 'voided'
    );
    const commissionStatus = isCancelledOrRefunded ? 'REVERSED' : 'PENDING';

    // Auto-create affiliate link if creator is matched but has no link yet
    if (creator && !link && !isSampleOrder) {
      link = await prisma.affiliateLink.create({
        data: {
          organizationId: organization.id,
          creatorId: creator.id,
          targetType: 'STORE',
          destinationPath: '/',
          commissionRate: 10,
          slug: `link_${creator.creatorCode || creator.id.slice(-6)}_${Date.now().toString(36)}`,
        },
        select: { id: true, creatorId: true, commissionRate: true },
      });
    }

    // If attributed and not an internal sample, upsert commission
    if (link && !isSampleOrder) {
      const orderAmount = subtotal > 0 ? subtotal : Number(total || 0);
      const rate = Number(link.commissionRate ?? 10);
      const amount = (orderAmount * rate) / 100;

      await prisma.affiliateCommission.upsert({
        where: { shopifyOrderId: order.id },
        create: {
          organizationId: organization.id,
          linkId: link.id,
          creatorId: link.creatorId ?? creator?.id ?? null,
          shopifyOrderId: order.id,
          orderAmount,
          commissionRate: link.commissionRate ?? 10,
          amount,
          status: commissionStatus,
        },
        update: {
          orderAmount,
          amount,
          status: commissionStatus,
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
