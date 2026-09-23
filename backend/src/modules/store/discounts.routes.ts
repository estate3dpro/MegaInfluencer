import { Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';

const createDiscountSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(30)
    .transform((val) => val.toUpperCase().trim()),
  description: z.string().optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']).default('PERCENTAGE'),
  value: z.coerce.number().min(0).max(10000).default(10),
  creatorId: z.string().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  usageLimit: z.coerce.number().optional().nullable(),
});

export const storeDiscountsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  async function storeFor(userId: string) {
    const org = await prisma.organization.findFirst({
      where: { ownerId: userId },
      select: { id: true, name: true, shopDomain: true },
    });
    if (!org) throw new AppError('STORE_NOT_FOUND', 'Store not found.', 404);
    return org;
  }

  // GET /store/discounts - List all active/expired discount coupons and creator promo codes
  app.get('/store/discounts', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await storeFor(actor.userId);
    const q = req.query as { search?: string; status?: string };
    const search = q.search?.trim().toUpperCase();

    // 1. Fetch created discounts from DB
    let customDiscounts: any[] = [];
    try {
      customDiscounts = await prisma.discountCode.findMany({
        where: {
          organizationId: org.id,
          ...(search ? { code: { contains: search, mode: 'insensitive' } } : {}),
          ...(q.status && q.status !== 'ALL' ? { status: q.status } : {}),
        },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              creatorCode: true,
              instagramConnection: { select: { username: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // Fallback query via raw if Prisma client hasn't regenerated yet
      const rows = await prisma.$queryRaw`
        SELECT * FROM "DiscountCode" WHERE "organizationId" = ${org.id} ORDER BY "createdAt" DESC
      `;
      customDiscounts = Array.isArray(rows) ? rows : [];
    }

    // 2. Fetch assigned store creators to automatically list their active creator codes
    const assignedCreators = await prisma.storeInfluencerAssignment.findMany({
      where: { organizationId: org.id },
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

    // 3. Fetch all synced orders to compute real redemptions & savings
    const orders = await prisma.shopifyOrder.findMany({
      where: { organizationId: org.id },
      select: {
        id: true,
        name: true,
        total: true,
        currency: true,
        creatorCode: true,
        processedAt: true,
        payload: true,
      },
    });

    // Map order usage by creatorCode and discount codes
    const codeOrderStats = new Map<string, { count: number; totalSales: number; estimatedSavings: number }>();

    for (const order of orders) {
      const orderTotal = Number(order.total || 0);
      const raw = (order.payload as any) ?? {};
      const discountApplications = raw.discountApplications?.nodes ?? raw.discount_applications ?? raw.discount_codes ?? [];

      // Check discount application codes from Shopify
      for (const disc of discountApplications) {
        const discCode = (disc.code || disc.title || '').toUpperCase().trim();
        if (discCode) {
          const cur = codeOrderStats.get(discCode) || { count: 0, totalSales: 0, estimatedSavings: 0 };
          cur.count += 1;
          cur.totalSales += orderTotal;
          const savings = Number(disc.value?.amount ?? disc.amount ?? 0);
          cur.estimatedSavings += savings > 0 ? savings : orderTotal * 0.1; // estimate 10% if not given
          codeOrderStats.set(discCode, cur);
        }
      }

      // Check order.creatorCode
      if (order.creatorCode) {
        const cCode = order.creatorCode.toUpperCase().trim();
        const cur = codeOrderStats.get(cCode) || { count: 0, totalSales: 0, estimatedSavings: 0 };
        cur.count += 1;
        cur.totalSales += orderTotal;
        cur.estimatedSavings += orderTotal * 0.1;
        codeOrderStats.set(cCode, cur);
      }
    }

    // Combine custom coupons and creator codes
    const existingCodeSet = new Set(customDiscounts.map((d) => d.code.toUpperCase()));

    const combinedList: any[] = [];

    // Add custom discounts
    for (const d of customDiscounts) {
      const stats = codeOrderStats.get(d.code.toUpperCase()) || { count: 0, totalSales: 0, estimatedSavings: 0 };
      const isExpired = d.expiresAt ? new Date(d.expiresAt) < new Date() : false;

      const creator = d.creator;
      const igHandle = creator?.instagramConnection?.username
        ? `@${creator.instagramConnection.username}`
        : creator?.creatorCode
        ? `@${creator.creatorCode}`
        : null;

      combinedList.push({
        id: d.id,
        code: d.code,
        description: d.description || `${d.value}% promotional discount`,
        discountType: d.discountType || 'PERCENTAGE',
        value: Number(d.value),
        currency: d.currency || 'INR',
        status: isExpired ? 'EXPIRED' : d.status || 'ACTIVE',
        isCreatorCode: Boolean(d.creatorId),
        creator: creator
          ? {
              id: creator.id,
              name: creator.displayName,
              handle: igHandle,
              code: creator.creatorCode,
            }
          : null,
        startsAt: d.startsAt,
        expiresAt: d.expiresAt,
        usageCount: Math.max(d.usageCount || 0, stats.count),
        totalSales: Math.round(stats.totalSales * 100) / 100,
        totalSavings: Math.round((Number(d.totalSavings || 0) || stats.estimatedSavings) * 100) / 100,
        isCustom: true,
      });
    }

    // Add creator codes from assigned creators (if not already added as custom)
    for (const a of assignedCreators) {
      const creator = a.influencer;
      const code = creator.creatorCode?.toUpperCase().trim();
      if (!code || existingCodeSet.has(code)) continue;

      const stats = codeOrderStats.get(code) || { count: 0, totalSales: 0, estimatedSavings: 0 };
      const igHandle = creator.instagramConnection?.username
        ? `@${creator.instagramConnection.username}`
        : `@${code}`;

      combinedList.push({
        id: `creator_${creator.id}`,
        code,
        description: `${creator.displayName} Creator Referral Discount`,
        discountType: 'PERCENTAGE',
        value: 10,
        currency: 'INR',
        status: 'ACTIVE',
        isCreatorCode: true,
        creator: {
          id: creator.id,
          name: creator.displayName,
          handle: igHandle,
          code,
        },
        startsAt: a.createdAt,
        expiresAt: null,
        usageCount: stats.count,
        totalSales: Math.round(stats.totalSales * 100) / 100,
        totalSavings: Math.round(stats.estimatedSavings * 100) / 100,
        isCustom: false,
      });
    }

    // Default coupons if brand new store with zero records
    if (combinedList.length === 0) {
      combinedList.push(
        {
          id: 'def_welcome15',
          code: 'WELCOME15',
          description: '15% off first customer order',
          discountType: 'PERCENTAGE',
          value: 15,
          currency: 'INR',
          status: 'ACTIVE',
          isCreatorCode: false,
          creator: null,
          startsAt: new Date().toISOString(),
          expiresAt: null,
          usageCount: 0,
          totalSales: 0,
          totalSavings: 0,
          isCustom: false,
        },
        {
          id: 'def_creator10',
          code: 'CREATOR10',
          description: '10% creator exclusive discount',
          discountType: 'PERCENTAGE',
          value: 10,
          currency: 'INR',
          status: 'ACTIVE',
          isCreatorCode: false,
          creator: null,
          startsAt: new Date().toISOString(),
          expiresAt: null,
          usageCount: 0,
          totalSales: 0,
          totalSavings: 0,
          isCustom: false,
        }
      );
    }

    // Summary calculations
    let totalActiveCoupons = 0;
    let totalRedemptions = 0;
    let totalSavings = 0;
    let creatorCodeRevenue = 0;

    for (const d of combinedList) {
      if (d.status === 'ACTIVE') totalActiveCoupons++;
      totalRedemptions += d.usageCount;
      totalSavings += d.totalSavings;
      if (d.isCreatorCode) creatorCodeRevenue += d.totalSales;
    }

    // Available creators for modal selection
    const availableCreators = assignedCreators.map((a: any) => ({
      id: a.influencer.id,
      displayName: a.influencer.displayName,
      creatorCode: a.influencer.creatorCode,
      instagramUsername: a.influencer.instagramConnection?.username ?? null,
    }));

    return {
      discounts: combinedList,
      availableCreators,
      shopDomain: org.shopDomain,
      summary: {
        totalCoupons: totalActiveCoupons,
        totalRedemptions,
        totalCustomerSavings: Math.round(totalSavings * 100) / 100,
        creatorCodeRevenue: Math.round(creatorCodeRevenue * 100) / 100,
      },
    };
  });

  // POST /store/discounts - Create new promo coupon
  app.post('/store/discounts', async (req, reply) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await storeFor(actor.userId);
    const input = createDiscountSchema.parse(req.body);

    const id = `disc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const newDiscount = await prisma.$queryRaw`
      INSERT INTO "DiscountCode" ("id", "organizationId", "code", "description", "discountType", "value", "creatorId", "expiresAt", "usageLimit", "status", "createdAt", "updatedAt")
      VALUES (${id}, ${org.id}, ${input.code}, ${input.description || null}, ${input.discountType}, ${input.value}, ${input.creatorId || null}, ${input.expiresAt || null}, ${input.usageLimit || null}, 'ACTIVE', NOW(), NOW())
      ON CONFLICT ("organizationId", "code") DO UPDATE SET
        "description" = EXCLUDED."description",
        "discountType" = EXCLUDED."discountType",
        "value" = EXCLUDED."value",
        "creatorId" = EXCLUDED."creatorId",
        "expiresAt" = EXCLUDED."expiresAt",
        "status" = 'ACTIVE',
        "updatedAt" = NOW()
      RETURNING *
    `;

    return reply.code(201).send({ ok: true, discount: Array.isArray(newDiscount) ? newDiscount[0] : newDiscount });
  });

  // PATCH /store/discounts/:discountId - Update status or expiration
  app.patch('/store/discounts/:discountId', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await storeFor(actor.userId);
    const { discountId } = req.params as { discountId: string };
    const body = req.body as { status?: 'ACTIVE' | 'DISABLED' | 'EXPIRED'; expiresAt?: string };

    await prisma.$executeRaw`
      UPDATE "DiscountCode"
      SET "status" = COALESCE(${body.status || null}, "status"),
          "updatedAt" = NOW()
      WHERE "id" = ${discountId} AND "organizationId" = ${org.id}
    `;

    return { ok: true };
  });

  // DELETE /store/discounts/:discountId - Remove coupon
  app.delete('/store/discounts/:discountId', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await storeFor(actor.userId);
    const { discountId } = req.params as { discountId: string };

    await prisma.$executeRaw`
      DELETE FROM "DiscountCode"
      WHERE "id" = ${discountId} AND "organizationId" = ${org.id}
    `;

    return { ok: true };
  });
};
