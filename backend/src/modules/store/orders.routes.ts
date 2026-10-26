import { Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { decryptToken } from '../instagram/instagram.crypto.js';
import { resolveOrderPlatform } from '../../shared/order-platform.js';

type Node = Record<string, any>;
type Page = { items?: Node[]; pageInfo?: { hasNextPage: boolean; endCursor: string | null }; error?: string };

const queryWithJourney = `query Orders($after:String){orders(first:100,after:$after,sortKey:PROCESSED_AT,reverse:true){nodes{id name email phone note tags customAttributes{key value} displayFinancialStatus displayFulfillmentStatus processedAt createdAt totalPriceSet{shopMoney{amount currencyCode}} totalShippingPriceSet{shopMoney{amount currencyCode}} totalTaxSet{shopMoney{amount currencyCode}} discountApplications(first:10){nodes{... on DiscountCodeApplication{code}}} customerJourneySummary{firstVisit{landingPage referrerUrl utmParameters{source medium campaign}} lastVisit{landingPage referrerUrl utmParameters{source medium campaign}}} lineItems(first:250){nodes{title quantity sku customAttributes{key value} originalUnitPriceSet{shopMoney{amount currencyCode}} variant{title image{url}} image{url}}} shippingAddress{firstName lastName name address1 address2 city province zip country phone} customer{firstName lastName email phone} } pageInfo{hasNextPage endCursor}}}`;

const queryStandard = `query Orders($after:String){orders(first:100,after:$after,sortKey:PROCESSED_AT,reverse:true){nodes{id name email phone note tags customAttributes{key value} displayFinancialStatus displayFulfillmentStatus processedAt createdAt totalPriceSet{shopMoney{amount currencyCode}} totalShippingPriceSet{shopMoney{amount currencyCode}} totalTaxSet{shopMoney{amount currencyCode}} discountApplications(first:10){nodes{... on DiscountCodeApplication{code}}} lineItems(first:250){nodes{title quantity sku customAttributes{key value} originalUnitPriceSet{shopMoney{amount currencyCode}} variant{title image{url}} image{url}}} shippingAddress{firstName lastName name address1 address2 city province zip country phone} customer{firstName lastName email phone} } pageInfo{hasNextPage endCursor}}}`;

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

    let r = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query: queryWithJourney, variables: { after } }),
    });
    let b = (await r.json().catch(() => null)) as any;

    if (b?.errors?.some((err: any) => err.message?.includes('customerJourneySummary') || err.message?.includes('access'))) {
      r = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
        body: JSON.stringify({ query: queryStandard, variables: { after } }),
      });
      b = (await r.json().catch(() => null)) as any;
    }

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

  // GET /store/orders - Only orders attributed through this platform. Shopify
  // continues to sync and store all orders; direct-store orders are not
  // exposed in the creator-commerce workspace.
  app.get('/store/orders', async (req) => {
    const a = requireRole(req, ['STORE_OWNER']);
    const s = await storeFor(app, a.userId);
    const q = req.query as {
      page?: string;
      limit?: string;
      search?: string;
      financialStatus?: string;
      fulfillmentStatus?: string;
      platform?: string;
      creatorId?: string;
      commissionStatus?: string;
      startDate?: string;
      endDate?: string;
    };

    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 25));
    const search = q.search?.trim();

    const andClauses: Prisma.ShopifyOrderWhereInput[] = [
      {
        OR: [
          { creatorCode: { not: null } },
          { affiliateLinkId: { not: null } },
          { affiliateCommissions: { some: {} } },
        ],
      },
    ];

    if (search) {
      andClauses.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { creatorCode: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (q.financialStatus && q.financialStatus !== 'ALL') {
      andClauses.push({ financialStatus: { equals: q.financialStatus, mode: 'insensitive' } });
    }

    if (q.fulfillmentStatus && q.fulfillmentStatus !== 'ALL') {
      if (q.fulfillmentStatus === 'UNFULFILLED') {
        andClauses.push({
          OR: [
            { fulfillmentStatus: null },
            { fulfillmentStatus: { in: ['UNFULFILLED', 'unfulfilled', 'null', ''] } },
          ],
        });
      } else {
        andClauses.push({ fulfillmentStatus: { in: ['FULFILLED', 'fulfilled'] } });
      }
    }

    if (q.creatorId && q.creatorId !== 'ALL') {
      const targetCreator = await prisma.user.findUnique({
        where: { id: q.creatorId },
        select: { id: true, creatorCode: true },
      });
      andClauses.push({
        OR: [
          { affiliateCommissions: { some: { creatorId: q.creatorId } } },
          { affiliateLink: { creatorId: q.creatorId } },
          ...(targetCreator?.creatorCode
            ? [{ creatorCode: { equals: targetCreator.creatorCode, mode: 'insensitive' as const } }]
            : []),
        ],
      });
    }

    if (q.commissionStatus && q.commissionStatus !== 'ALL') {
      andClauses.push({
        affiliateCommissions: {
          some: {
            status: q.commissionStatus as any,
          },
        },
      });
    }

    if (q.startDate || q.endDate) {
      const dateCondition: { gte?: Date; lte?: Date } = {};
      if (q.startDate) {
        const start = new Date(q.startDate);
        if (!isNaN(start.getTime())) {
          dateCondition.gte = start;
        }
      }
      if (q.endDate) {
        const end = new Date(q.endDate);
        if (!isNaN(end.getTime())) {
          if (q.endDate.length === 10) {
            end.setHours(23, 59, 59, 999);
          }
          dateCondition.lte = end;
        }
      }
      if (dateCondition.gte || dateCondition.lte) {
        andClauses.push({ processedAt: dateCondition });
      }
    }

    const where: Prisma.ShopifyOrderWhereInput = {
      organizationId: s.id,
      AND: andClauses,
    };

    const [rows, total, allOrdersSummary] = await Promise.all([
      prisma.shopifyOrder.findMany({
        where,
        orderBy: { processedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          affiliateLink: {
            include: {
              creator: {
                select: {
                  id: true,
                  displayName: true,
                  creatorCode: true,
                  email: true,
                  influencerProfile: {
                    select: {
                      profileImageUrl: true,
                      city: true,
                      phone: true,
                      bio: true,
                    },
                  },
                  instagramConnection: { select: { username: true } },
                },
              },
            },
          },
          affiliateCommissions: {
            include: {
              creator: {
                select: {
                  id: true,
                  displayName: true,
                  creatorCode: true,
                  email: true,
                  influencerProfile: {
                    select: {
                      profileImageUrl: true,
                      city: true,
                      phone: true,
                      bio: true,
                    },
                  },
                  instagramConnection: { select: { username: true } },
                },
              },
              link: {
                select: {
                  slug: true,
                  commissionRate: true,
                  clicks: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: { utmSource: true, utmMedium: true, utmCampaign: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.shopifyOrder.count({ where }),
      prisma.shopifyOrder.findMany({
        where: { organizationId: s.id, creatorCode: { not: null } },
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

    // Lookup any missing creator profiles for orders that have creatorCode but no linked commission yet
    const missingCodes = [
      ...new Set(
        rows
          .filter((o: any) => !o.affiliateCommissions?.[0]?.creator && !o.affiliateLink?.creator && o.creatorCode)
          .map((o: any) => o.creatorCode as string)
      ),
    ];
    let creatorsByCode: Record<string, any> = {};
    if (missingCodes.length > 0) {
      const foundCreators = await prisma.user.findMany({
        where: { creatorCode: { in: missingCodes, mode: 'insensitive' } },
        select: {
          id: true,
          displayName: true,
          creatorCode: true,
          email: true,
          influencerProfile: {
            select: { profileImageUrl: true, city: true, phone: true, bio: true },
          },
          instagramConnection: { select: { username: true } },
        },
      });
      for (const fc of foundCreators) {
        if (fc.creatorCode) {
          creatorsByCode[fc.creatorCode.toLowerCase()] = fc;
        }
      }
    }

    const formattedOrders = rows.map((order: any) => {
      const commission = order.affiliateCommissions?.[0];
      const creator =
        commission?.creator ||
        order.affiliateLink?.creator ||
        (order.creatorCode ? creatorsByCode[order.creatorCode.toLowerCase()] : null);

      const igUsername = creator?.instagramConnection?.username;
      const igHandle = igUsername
        ? `@${igUsername}`
        : creator?.creatorCode
          ? `@${creator.creatorCode}`
          : order.creatorCode
            ? `@${order.creatorCode}`
            : null;

      const clickUtm = commission?.link?.clicks?.[0] ?? null;
      const sourceInfo = resolveOrderPlatform(order.payload, clickUtm);

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
        platform: sourceInfo.platform,
        platformLabel: sourceInfo.platformLabel,
        utmSource: sourceInfo.utmSource,
        utmMedium: sourceInfo.utmMedium,
        utmCampaign: sourceInfo.utmCampaign,
        creator: creator
          ? {
            id: creator.id,
            name: creator.displayName,
            handle: igHandle,
            code: creator.creatorCode ?? order.creatorCode,
            email: creator.email ?? null,
            avatarUrl: creator.influencerProfile?.profileImageUrl ?? null,
            city: creator.influencerProfile?.city ?? null,
            phone: creator.influencerProfile?.phone ?? null,
            bio: creator.influencerProfile?.bio ?? null,
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

    const finalOrders = q.platform && q.platform !== 'ALL'
      ? formattedOrders.filter((o: any) => o.platform === q.platform)
      : formattedOrders;

    return {
      orders: finalOrders,
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
      const chunkSize = 10;
      for (let i = 0; i < p.items.length; i += chunkSize) {
        const chunk = p.items.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (item: Node) => {
            const raw = item.raw ?? item;
          const total = raw.totalPriceSet?.shopMoney;
          const orderAttributes = raw.customAttributes ?? item.customAttributes ?? raw.note_attributes ?? [];
          const lineItems = raw.lineItems?.nodes ?? raw.lineItems ?? item.lineItems ?? [];
          const lineAttributes = lineItems.flatMap((line: Node) => line.customAttributes ?? line.properties ?? []);
          const attributes = [...orderAttributes, ...lineAttributes];

          const getAttr = (key: string) => {
            const found = attributes.find((attr: Node) => {
              const k = String(attr?.key ?? attr?.name ?? '').trim().toLowerCase();
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

          // 2. Landing site / Customer journey URL parameter parsing
          const landingUrl = String(
            raw.customerJourneySummary?.firstVisit?.landingPage ??
            raw.customerJourneySummary?.lastVisit?.landingPage ??
            raw.landing_site ??
            raw.landingSite ??
            raw.referring_site ??
            raw.source_url ??
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
          const rawDiscountCodes: string[] = [
            ...(Array.isArray(raw.discount_codes) ? raw.discount_codes.map((d: any) => String(d.code || '').trim()) : []),
            ...(Array.isArray(raw.discountApplications?.nodes) ? raw.discountApplications.nodes.map((d: any) => String(d.code || d.title || '').trim()) : []),
            ...(Array.isArray(raw.discountApplications) ? raw.discountApplications.map((d: any) => String(d.code || d.title || '').trim()) : []),
            ...(raw.discountCode ? [String(raw.discountCode).trim()] : []),
          ].filter(Boolean);

          // 4. Order Note check
          const noteText = String(raw.note ?? item.note ?? '');
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

          // 5. Tags parsing
          const tags = raw.tags ?? item.tags ?? [];
          const tagList: string[] = Array.isArray(tags)
            ? tags.map((t: any) => String(t).trim())
            : typeof tags === 'string'
              ? tags.split(',').map((t: string) => t.trim())
              : [];

          const isSampleOrder = tagList.some((t: string) =>
            ['influencersample', 'bartersample', 'sample', 'barter'].includes(t.toLowerCase())
          );
          if (isSampleOrder) return;

          // Resolve creator & link
          let link: any = null;
          let creator: any = null;

          if (linkSlug) {
            link = await prisma.affiliateLink.findFirst({
              where: { organizationId: s.id, slug: String(linkSlug) },
              select: {
                id: true,
                creatorId: true,
                commissionType: true,
                commissionRate: true,
                commissionAmount: true,
                creator: { select: { id: true, creatorCode: true, role: true } },
              },
            });
            if (link?.creator) {
              creator = link.creator;
              trackedCreatorCode = creator.creatorCode ?? trackedCreatorCode;
            } else if (!link && !trackedCreatorCode) {
              // If linkSlug not found as slug, check if it's a creatorCode
              trackedCreatorCode = String(linkSlug);
            }
          }

          if (!link && trackedCreatorCode) {
            // First check if trackedCreatorCode is an affiliate link slug
            const slugLink = await prisma.affiliateLink.findFirst({
              where: { organizationId: s.id, slug: String(trackedCreatorCode) },
              select: {
                id: true,
                creatorId: true,
                commissionType: true,
                commissionRate: true,
                commissionAmount: true,
                creator: { select: { id: true, creatorCode: true, role: true } },
              },
            });
            if (slugLink) {
              link = slugLink;
              creator = slugLink.creator;
              trackedCreatorCode = creator?.creatorCode ?? trackedCreatorCode;
            } else {
              // Prioritize creators assigned to this store first
              const assigned = await prisma.storeInfluencerAssignment.findMany({
                where: { organizationId: s.id },
                include: {
                  influencer: {
                    select: {
                      id: true,
                      creatorCode: true,
                      role: true,
                      instagramConnection: { select: { username: true } },
                      discountCodes: { where: { organizationId: s.id }, select: { code: true } },
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
                  where: { creatorId: creator.id, organizationId: s.id, status: 'ACTIVE' },
                  select: { id: true, creatorId: true, commissionType: true, commissionRate: true, commissionAmount: true },
                });
              }
            }
          }

          if (!link && rawDiscountCodes.length > 0) {
            for (const code of rawDiscountCodes) {
              const cleanCode = String(code).trim().toLowerCase();
              let matchedCreator: any = null;

              const assigned = await prisma.storeInfluencerAssignment.findMany({
                where: { organizationId: s.id },
                include: {
                  influencer: {
                    select: {
                      id: true,
                      creatorCode: true,
                      role: true,
                      instagramConnection: { select: { username: true } },
                      discountCodes: { where: { organizationId: s.id }, select: { code: true } },
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

              if (!matchedCreator) {
                const customDisc = await prisma.discountCode.findFirst({
                  where: {
                    organizationId: s.id,
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
                  where: { creatorId: creator.id, organizationId: s.id, status: 'ACTIVE' },
                  select: { id: true, creatorId: true, commissionType: true, commissionRate: true, commissionAmount: true },
                });
                break;
              }
            }
          }

          const finalCreatorCode = trackedCreatorCode ?? link?.creator?.creatorCode ?? creator?.creatorCode ?? null;
          const finalLinkId = link?.id ?? null;

          const existingOrder = await prisma.shopifyOrder.findUnique({
            where: { organizationId_shopifyId: { organizationId: s.id, shopifyId: item.shopifyGid ?? raw.id } },
          });

          let effectiveCreatorCode = finalCreatorCode;
          let effectiveLinkId = finalLinkId;
          let isLocked = existingOrder?.isAttributionLocked ?? false;
          let attributionMethod = existingOrder?.attributionMethod ?? null;
          let attributionEvidence = existingOrder?.attributionEvidence ?? null;
          let attributionLockedAt = existingOrder?.attributionLockedAt ?? null;
          let tamperFlagged = existingOrder?.tamperFlagged ?? false;
          let tamperDetails = existingOrder?.tamperDetails ?? null;

          if (existingOrder && existingOrder.isAttributionLocked) {
            // Enterprise standard: Locked attribution cannot be modified by external sync
            const incomingDiffers = finalCreatorCode && finalCreatorCode.toLowerCase() !== String(existingOrder.creatorCode || '').toLowerCase();
            if (incomingDiffers) {
              tamperFlagged = true;
              tamperDetails = {
                attemptedCreatorCode: finalCreatorCode,
                attemptedLinkId: finalLinkId,
                lockedCreatorCode: existingOrder.creatorCode,
                lockedLinkId: existingOrder.affiliateLinkId,
                detectedAt: new Date().toISOString(),
                eventTopic: 'orders/sync',
                reason: 'Sync from Shopify contained conflicting attribution for locked order.',
              };

              await prisma.orderAttributionAudit.create({
                data: {
                  organizationId: s.id,
                  shopifyOrderId: existingOrder.id,
                  action: 'TAMPER_ATTEMPT_BLOCKED',
                  actor: 'SYSTEM_SYNC',
                  fromCode: existingOrder.creatorCode,
                  toCode: finalCreatorCode,
                  reason: `Blocked manual sync from modifying locked attribution from @${existingOrder.creatorCode || 'None'} to @${finalCreatorCode}.`,
                },
              }).catch(() => null);
            }

            effectiveCreatorCode = existingOrder.creatorCode;
            effectiveLinkId = existingOrder.affiliateLinkId;
            if (effectiveLinkId) {
              const lockedLink = await prisma.affiliateLink.findUnique({
                where: { id: effectiveLinkId },
                include: { creator: true },
              });
              if (lockedLink?.creator) {
                link = lockedLink;
                creator = lockedLink.creator;
              }
            } else if (effectiveCreatorCode) {
              const lockedCreator = await prisma.user.findFirst({
                where: { creatorCode: { equals: effectiveCreatorCode, mode: 'insensitive' } },
              });
              if (lockedCreator) {
                creator = lockedCreator;
                link = await prisma.affiliateLink.findFirst({
                  where: { creatorId: lockedCreator.id, organizationId: s.id, status: 'ACTIVE' },
                });
              }
            }
          } else {
            if (finalCreatorCode || finalLinkId) {
              isLocked = true;
              attributionLockedAt = new Date();
              attributionMethod = rawDiscountCodes.length > 0 ? 'DISCOUNT_CODE' : (linkSlug ? 'AFFILIATE_LINK' : 'SYNC_RESOLVED');
              attributionEvidence = {
                discountCodes: rawDiscountCodes,
                linkSlug,
                trackedCreatorCode,
                lockedAt: attributionLockedAt.toISOString(),
              };
            }
          }

          const d = {
            shopifyId: item.shopifyGid ?? raw.id,
            name: item.name ?? raw.name,
            email: item.customerEmail ?? raw.email ?? raw.customer?.email ?? null,
            currency: item.currencyCode ?? total?.currencyCode ?? null,
            total: item.totalAmount ?? total?.amount ?? null,
            financialStatus: item.financialStatus ?? raw.displayFinancialStatus ?? null,
            fulfillmentStatus: raw.displayFulfillmentStatus ?? null,
            processedAt: item.shopifyCreatedAt ?? raw.processedAt ? new Date(item.shopifyCreatedAt ?? raw.processedAt) : null,
            creatorCode: effectiveCreatorCode,
            affiliateLinkId: effectiveLinkId,
            isAttributionLocked: isLocked,
            attributionMethod,
            attributionEvidence: attributionEvidence as Prisma.InputJsonValue,
            attributionLockedAt,
            tamperFlagged,
            tamperDetails: tamperDetails as Prisma.InputJsonValue,
            payload: raw as Prisma.InputJsonValue,
          };

          const order = await prisma.shopifyOrder.upsert({
            where: { organizationId_shopifyId: { organizationId: s.id, shopifyId: d.shopifyId } },
            create: { organizationId: s.id, ...d },
            update: d,
          });

          // The store roster switch is the temporary compensation source of truth.
          // It deliberately bypasses campaign compensation while that workflow is repaired.
          let compensationMode: 'COMMISSION' | 'BARTER' = 'COMMISSION';
          let isAutoCommission = true;
          if (creator) {
            const assignment = await prisma.storeInfluencerAssignment.findUnique({
              where: { organizationId_influencerId: { organizationId: s.id, influencerId: creator.id } },
              select: { compensationMode: true, autoCommission: true },
            });
            if (assignment?.compensationMode === 'BARTER') compensationMode = 'BARTER';
            if (typeof (assignment as any)?.autoCommission === 'boolean') {
              isAutoCommission = (assignment as any).autoCommission;
            }
          }

          // A link is also required for barter orders so they can be attributed and counted.
          if (creator && !link) {
            link = await prisma.affiliateLink.create({
              data: {
                organizationId: s.id,
                creatorId: creator.id,
                targetType: 'STORE',
                destinationPath: '/',
                commissionRate: 10,
                slug: `link_${creator.creatorCode || creator.id.slice(-6)}_${Date.now().toString(36)}`,
              },
              select: { id: true, creatorId: true, commissionType: true, commissionRate: true, commissionAmount: true },
            });
          }

          // Ensure order retains attributed affiliateLinkId and creatorCode
          if (link?.id || effectiveCreatorCode) {
            await prisma.shopifyOrder.update({
              where: { id: order.id },
              data: {
                affiliateLinkId: link?.id ?? effectiveLinkId,
                creatorCode: effectiveCreatorCode ?? creator?.creatorCode ?? undefined,
              },
            });
          }

          const hasLinkCommission = link?.commissionType === 'FIXED_AMOUNT'
            ? Number(link.commissionAmount ?? 0) > 0
            : Number(link?.commissionRate ?? 0) > 0;

          if (link && creator && (compensationMode === 'BARTER' || hasLinkCommission)) {
            const orderAmount = Number(d.total ?? 0);
            const isRefunded = d.financialStatus === 'REFUNDED' || d.financialStatus === 'refunded';
            const status = isRefunded ? 'REVERSED' : (isAutoCommission ? 'APPROVED' : 'PENDING');
            const isFixedAmountLink = link.commissionType === 'FIXED_AMOUNT';
            const commissionRate = compensationMode === 'BARTER' || isFixedAmountLink ? 0 : Number(link.commissionRate ?? 10);
            const matchedUserId = link.creatorId ?? creator.id;

            let commAmount = isFixedAmountLink ? Number(link.commissionAmount ?? 0) : (orderAmount * commissionRate) / 100;

            if (compensationMode !== 'BARTER' && !isFixedAmountLink) {
              const storeConfig = await prisma.storeReferralConfig.findUnique({
                where: { organizationId: s.id },
                select: {
                  multiProductCommissionMode: true,
                  fallbackCommissionRate: true,
                  percentageEnabled: true,
                  fixedTokensEnabled: true,
                  fixedTokensPerOrder: true,
                },
              });

              const isFlatRupees = Boolean(storeConfig?.fixedTokensEnabled && !storeConfig?.percentageEnabled);
              const isBoth = Boolean(storeConfig?.fixedTokensEnabled && storeConfig?.percentageEnabled);
              const flatRateAmount = Number(storeConfig?.fixedTokensPerOrder ?? 50);

              if (isFlatRupees) {
                // Flat rate commission in Rupees per order
                commAmount = flatRateAmount;
              } else if (isBoth) {
                // Combined flat rupee commission + percentage
                commAmount = flatRateAmount + ((orderAmount * commissionRate) / 100);
              } else if (commissionRate > 0) {
                const mode = storeConfig?.multiProductCommissionMode ?? 'STORE_WIDE';
                const fallbackRate = Number(storeConfig?.fallbackCommissionRate ?? 0);
                const canonicalId = (val: unknown) => String(val ?? '').split('/').pop();

                const assignedProductRows = await prisma.productInfluencerAssignment.findMany({
                  where: { organizationId: s.id, influencerId: matchedUserId },
                  select: { product: { select: { shopifyId: true } } },
                });
                const assignedProductSet = new Set<string>();
                for (const p of assignedProductRows) {
                  const cid = canonicalId(p.product?.shopifyId);
                  if (cid) assignedProductSet.add(cid);
                }

                const rawOrder = (d as any).raw ?? (d as any).payload ?? d;
                const lineItems = Array.isArray(rawOrder.line_items)
                  ? rawOrder.line_items
                  : Array.isArray(rawOrder.lineItems)
                    ? rawOrder.lineItems
                    : [];

                let assignedItemsTotal = 0;
                let unassignedItemsTotal = 0;
                let hasAssignedProductInCart = false;
                const hasSpecificAssignments = assignedProductSet.size > 0;

                for (const item of lineItems) {
                  const itemProdId = canonicalId(item.product_id ?? item.productId ?? item.product?.id);
                  const price = Number(item.price ?? 0);
                  const quantity = Number(item.quantity ?? 1);
                  const itemTotal = price * quantity;

                  if (!hasSpecificAssignments || (itemProdId && assignedProductSet.has(itemProdId))) {
                    assignedItemsTotal += itemTotal;
                    hasAssignedProductInCart = true;
                  } else {
                    unassignedItemsTotal += itemTotal;
                  }
                }

                if (mode === 'ASSIGNED_PRODUCTS_ONLY') {
                  commAmount = (assignedItemsTotal * commissionRate) / 100;
                } else if (mode === 'GATE_REQUIRED') {
                  commAmount = hasAssignedProductInCart ? (orderAmount * commissionRate) / 100 : 0;
                } else if (mode === 'HYBRID_FALLBACK') {
                  const assignedComm = (assignedItemsTotal * commissionRate) / 100;
                  const unassignedComm = (unassignedItemsTotal * fallbackRate) / 100;
                  commAmount = assignedComm + unassignedComm;
                } else {
                  commAmount = (orderAmount * commissionRate) / 100;
                }
              }
            }

            await prisma.affiliateCommission.upsert({
              where: { shopifyOrderId: order.id },
              create: {
                organizationId: s.id,
                linkId: link.id,
                creatorId: matchedUserId,
                shopifyOrderId: order.id,
                orderAmount,
                commissionType: isFixedAmountLink ? 'FIXED_AMOUNT' : 'PERCENTAGE',
                commissionRate,
                amount: commAmount,
                status,
              },
              update: {
                linkId: link.id,
                creatorId: matchedUserId,
                orderAmount,
                commissionType: isFixedAmountLink ? 'FIXED_AMOUNT' : 'PERCENTAGE',
                commissionRate,
                amount: commAmount,
                status,
              },
            });
          }
        })
      );
      }
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
        attributionAudits: {
          orderBy: { createdAt: 'desc' },
          take: 25,
        },
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
                clicks: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                  select: { utmSource: true, utmMedium: true, utmCampaign: true },
                },
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

    const commission = order.affiliateCommissions?.[0] ?? null;
    const clickUtm = commission?.link?.clicks?.[0] ?? null;
    const sourceInfo = resolveOrderPlatform(raw, clickUtm);

    const customAttributes = raw.customAttributes ?? [];
    const linkSlug = customAttributes.find((a: any) => (a.key ?? a.name) === 'mi_link')?.value ?? commission?.link?.slug ?? null;

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
        isAttributionLocked: order.isAttributionLocked,
        attributionMethod: order.attributionMethod,
        attributionLockedAt: order.attributionLockedAt,
        attributionEvidence: order.attributionEvidence,
        tamperFlagged: order.tamperFlagged,
        tamperDetails: order.tamperDetails,
        attributionAudits: order.attributionAudits ?? [],
        attribution: {
          creatorCode: order.creatorCode,
          linkSlug,
          platform: sourceInfo.platform,
          platformLabel: sourceInfo.platformLabel,
          utmSource: sourceInfo.utmSource,
          utmMedium: sourceInfo.utmMedium,
          utmCampaign: sourceInfo.utmCampaign,
          referrer: sourceInfo.referrer,
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

    const oldStatus = commission.status;
    const updated = await prisma.affiliateCommission.update({
      where: { id: commission.id },
      data: { status },
    });

    // If commission was approved by store admin and belongs to a Customer Advocate, credit points
    if (commission.creatorId) {
      const profile = await prisma.customerProfile.findUnique({ where: { userId: commission.creatorId } });
      if (profile) {
        const points = Math.round(Number(commission.amount));
        if (oldStatus === 'PENDING' && (status === 'APPROVED' || status === 'PAID')) {
          await prisma.customerProfile.update({
            where: { userId: commission.creatorId },
            data: {
              pointsBalance: { increment: points },
              totalEarned: { increment: Number(commission.amount) },
            },
          });
        } else if ((oldStatus === 'APPROVED' || oldStatus === 'PAID') && status === 'REVERSED') {
          await prisma.customerProfile.update({
            where: { userId: commission.creatorId },
            data: {
              pointsBalance: { decrement: Math.min(profile.pointsBalance, points) },
              totalEarned: { decrement: Number(commission.amount) },
            },
          });
        }
      }
    }

    return { ok: true, commission: updated };
  });

  // POST /store/orders/:orderId/attribute - Manually attribute or re-assign order to a creator
  const attributeOrderSchema = z.object({
    creatorId: z.string().nullable().optional(),
    commissionRate: z.number().min(0).max(999.99).optional(),
    reason: z.string().max(500).optional(),
  });

  app.post('/store/orders/:orderId/attribute', async (req) => {
    const a = requireRole(req, ['STORE_OWNER']);
    const s = await storeFor(app, a.userId);
    const { orderId } = req.params as { orderId: string };
    const { creatorId, commissionRate: customRate, reason } = attributeOrderSchema.parse(req.body);

    const order = await prisma.shopifyOrder.findFirst({
      where: { id: orderId, organizationId: s.id },
    });

    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found.', 404);
    }

    if (!creatorId) {
      // Remove attribution
      await prisma.shopifyOrder.update({
        where: { id: order.id },
        data: {
          creatorCode: null,
          affiliateLinkId: null,
          isAttributionLocked: false,
          attributionMethod: null,
          attributionEvidence: Prisma.DbNull,
          attributionLockedAt: null,
          tamperFlagged: false,
          tamperDetails: Prisma.DbNull,
        },
      });
      await prisma.affiliateCommission.deleteMany({
        where: { shopifyOrderId: order.id },
      });

      await prisma.orderAttributionAudit.create({
        data: {
          organizationId: s.id,
          shopifyOrderId: order.id,
          action: 'ATTRIBUTION_REMOVED',
          actor: `STORE_OWNER:${a.userId}`,
          fromCode: order.creatorCode,
          reason: reason || 'Attribution removed by store owner',
        },
      }).catch(() => null);

      return { ok: true, attributed: false };
    }

    const creator = await prisma.user.findFirst({
      where: { id: creatorId, role: 'INFLUENCER' },
      select: { id: true, creatorCode: true, displayName: true },
    });

    if (!creator) {
      throw new AppError('CREATOR_NOT_FOUND', 'Selected creator not found.', 404);
    }

    // Find or create affiliate link for this creator
    let link = await prisma.affiliateLink.findFirst({
      where: { creatorId: creator.id, organizationId: s.id, status: 'ACTIVE' },
    });

    const assignment = await prisma.storeInfluencerAssignment.findUnique({
      where: { organizationId_influencerId: { organizationId: s.id, influencerId: creator.id } },
      select: { compensationMode: true },
    });
    const isBarter = assignment?.compensationMode === 'BARTER';
    const rate = isBarter ? 0 : (customRate ?? (link ? Number(link.commissionRate) : 10));

    if (!link) {
      link = await prisma.affiliateLink.create({
        data: {
          organizationId: s.id,
          creatorId: creator.id,
          targetType: 'STORE',
          destinationPath: '/',
          commissionRate: rate,
          slug: `link_${creator.creatorCode || creator.id.slice(-6)}_${Date.now().toString(36)}`,
        },
      });
    }

    const amount = Number(order.total || 0);
    const isRefunded = /refund/i.test(order.financialStatus || '');

    const storeConfig = await prisma.storeReferralConfig.findUnique({
      where: { organizationId: s.id },
      select: { fixedTokensEnabled: true, percentageEnabled: true, fixedTokensPerOrder: true },
    });
    const isFlatRupees = Boolean(storeConfig?.fixedTokensEnabled && !storeConfig?.percentageEnabled);
    const flatAmount = Number(storeConfig?.fixedTokensPerOrder ?? 50);

    const commissionAmount = isBarter ? 0 : (isFlatRupees ? flatAmount : (amount * rate) / 100);

    await prisma.shopifyOrder.update({
      where: { id: order.id },
      data: {
        creatorCode: creator.creatorCode,
        affiliateLinkId: link.id,
        isAttributionLocked: true,
        attributionMethod: 'MANUAL_OVERRIDE',
        attributionLockedAt: new Date(),
        tamperFlagged: false,
        tamperDetails: Prisma.DbNull,
      },
    });

    await prisma.orderAttributionAudit.create({
      data: {
        organizationId: s.id,
        shopifyOrderId: order.id,
        action: 'ADMIN_OVERRIDE',
        actor: `STORE_OWNER:${a.userId}`,
        fromCode: order.creatorCode,
        toCode: creator.creatorCode,
        toCreatorId: creator.id,
        reason: reason || 'Manual attribution reassignment by store owner',
      },
    }).catch(() => null);

    const commission = await prisma.affiliateCommission.upsert({
      where: { shopifyOrderId: order.id },
      create: {
        organizationId: s.id,
        linkId: link.id,
        creatorId: creator.id,
        shopifyOrderId: order.id,
        orderAmount: amount,
        commissionRate: rate,
        amount: commissionAmount,
        status: isRefunded ? 'REVERSED' : 'APPROVED',
      },
      update: {
        creatorId: creator.id,
        linkId: link.id,
        orderAmount: amount,
        commissionRate: rate,
        amount: commissionAmount,
        status: isRefunded ? 'REVERSED' : 'APPROVED',
      },
    });

    return { ok: true, attributed: true, creator, commission };
  });
};
