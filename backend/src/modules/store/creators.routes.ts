import argon2 from 'argon2';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { decryptToken } from '../instagram/instagram.crypto.js';
import { getInstagramProfile } from '../instagram/instagram.client.js';
import { getAssignedProductIds, setCreatorProductAssignments } from '../product-assignments/product-assignments.service.js';
import { getFrontendBaseUrl } from '../../shared/helpers/frontend-url.js';
import { ensureCreatorCode } from '../../shared/creator-code.js';
import { calculateOrderCommission, reconcileOrdersCommissions, reconcileStoreRosterCommissions } from './commission-calculator.js';

const passwordOptions = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

const createCreatorSchema = z.object({
  displayName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().optional().nullable().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().nullable().or(z.literal('')),
  phone: z.string().trim().optional().nullable().or(z.literal('')),
  instagramUsername: z.string().trim().optional().nullable().or(z.literal('')),
  compensationMode: z.enum(['COMMISSION', 'BARTER', 'HYBRID']).default('COMMISSION'),
  bio: z.string().trim().optional().nullable().or(z.literal('')),
  city: z.string().trim().optional().nullable().or(z.literal('')),
  autoCreateLink: z.boolean().default(true),
});

export const storeCreatorsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  async function organization(userId: string) {
    const org = await prisma.organization.findFirst({ where: { ownerId: userId }, select: { id: true, name: true, category: true } });
    if (!org) throw new AppError('STORE_NOT_FOUND', 'Store not found.', 404);
    return org;
  }

  function getAutoApproveSetting(categoryStr: string | null): boolean {
    if (!categoryStr) return true;
    try {
      const parsed = JSON.parse(categoryStr);
      if (typeof parsed.autoApprove === 'boolean') {
        return parsed.autoApprove;
      }
    } catch {
      if (categoryStr.includes('MANUAL_APPROVE')) return false;
    }
    return true;
  }

  function encodeAutoApproveSetting(existingCategory: string | null, autoApprove: boolean): string {
    let data: any = {};
    if (existingCategory) {
      try {
        data = JSON.parse(existingCategory);
      } catch {
        data = { originalCategory: existingCategory };
      }
    }
    data.autoApprove = autoApprove;
    return JSON.stringify(data);
  }

  // GET /store/creators
  app.get('/store/creators', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);

    // Automatically reconcile all store orders & commissions for all influencers in roster
    await reconcileStoreRosterCommissions(prisma, org.id);

    const [rows, attributedOrders, customDiscounts] = await Promise.all([
      prisma.storeInfluencerAssignment.findMany({
        where: { organizationId: org.id },
        orderBy: { createdAt: 'desc' },
        include: {
          influencer: {
            select: {
              id: true,
              displayName: true,
              email: true,
              status: true,
              creatorCode: true,
              createdAt: true,
              termsAcceptedAt: true,
              termsVersion: true,
              instagramConnection: { select: { username: true, displayName: true, status: true, encryptedAccessToken: true } },
              affiliateLinks: {
                where: { organizationId: org.id },
                select: { id: true, status: true, commissionRate: true, commissionType: true, commissionAmount: true },
              },
              affiliateCommissions: {
                where: { organizationId: org.id },
                select: { orderAmount: true, amount: true, status: true, creatorId: true },
              },
              barterFulfillments: {
                where: { organizationId: org.id },
                select: { id: true, productTitle: true, status: true, trackingNumber: true, carrier: true },
              },
            },
          },
        },
      }),
      prisma.shopifyOrder.findMany({
        where: {
          organizationId: org.id,
          OR: [
            { creatorCode: { not: null } },
            { affiliateLinkId: { not: null } },
            { affiliateCommissions: { some: { organizationId: org.id } } },
          ],
        },
        select: {
          id: true,
          total: true,
          creatorCode: true,
          affiliateLinkId: true,
          affiliateCommissions: {
            where: { organizationId: org.id },
            select: { creatorId: true, amount: true, orderAmount: true, status: true },
          },
        },
      }),
      prisma.discountCode.findMany({
        where: { organizationId: org.id },
        select: { creatorId: true, code: true },
      }),
    ]);

    return {
      creators: await Promise.all(rows.map(async (row: any) => {
        const inf = row.influencer;
        const infLinkIds = new Set((inf.affiliateLinks ?? []).map((l: any) => l.id));
        const creatorCodes = new Set<string>();
        if (inf.creatorCode) {
          creatorCodes.add(inf.creatorCode.toLowerCase());
          const base = inf.creatorCode.replace(/_pro$/i, '').trim();
          if (base) creatorCodes.add(base.toLowerCase());
        }
        if (inf.instagramConnection?.username) {
          creatorCodes.add(inf.instagramConnection.username.toLowerCase());
        }
        for (const cd of customDiscounts) {
          if (cd.creatorId === inf.id && cd.code) {
            creatorCodes.add(cd.code.toLowerCase());
          }
        }

        const creatorOrders = attributedOrders.filter((o: any) => {
          if (o.affiliateCommissions?.some((c: any) => c.creatorId === inf.id)) return true;
          if (o.creatorCode && creatorCodes.has(o.creatorCode.toLowerCase())) return true;
          if (o.affiliateLinkId && infLinkIds.has(o.affiliateLinkId)) return true;
          return false;
        });

        const commissions = (inf.affiliateCommissions ?? []).filter((c: any) => c.status !== 'REVERSED');
        const commSales = commissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount || 0), 0);
        const orderSales = creatorOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
        const totalSales = Math.max(commSales, orderSales);

        const totalCommissions = commissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
        const totalOrders = Math.max(commissions.length, creatorOrders.length);
        const activeLinks = (inf.affiliateLinks ?? []).filter((l: any) => l.status === 'ACTIVE').length;

        let instagramStatistics = null;
        if (inf.instagramConnection?.status === 'ACTIVE') {
          try {
            instagramStatistics = await getInstagramProfile(decryptToken(inf.instagramConnection.encryptedAccessToken));
          } catch {
            /* Instagram statistics optional */
          }
        }

        const rawMode = row.compensationMode || 'COMMISSION';
        const isPending = rawMode === 'PENDING';
        const mode = isPending ? 'COMMISSION' : rawMode;
        const samples = inf.barterFulfillments ?? [];

        return {
          id: inf.id,
          displayName: inf.displayName,
          email: inf.email,
          status: inf.status,
          creatorCode: inf.creatorCode,
          assignedAt: row.createdAt,
          termsAcceptedAt: inf.termsAcceptedAt ?? (inf.instagramConnection?.status === 'ACTIVE' ? inf.createdAt : null),
          termsVersion: inf.termsVersion ?? (inf.instagramConnection?.status === 'ACTIVE' ? 'v1.0' : null),
          instagramUsername: inf.instagramConnection?.username ?? null,
          instagramStatus: inf.instagramConnection?.status ?? null,
          instagramFollowersCount: instagramStatistics?.followers_count ?? null,
          instagramMediaCount: instagramStatistics?.media_count ?? null,
          totalSales,
          totalOrders,
          totalCommissions: mode === 'BARTER' ? 0 : totalCommissions,
          compensationMode: mode,
          autoCommission: (row as any).autoCommission ?? true,
          approvalStatus: isPending ? 'PENDING' : 'APPROVED',
          barterOrders: mode === 'BARTER' ? totalOrders : 0,
          barterGmv: mode === 'BARTER' ? totalSales : 0,
          activeLinks,
          sampleCount: samples.length,
          recentSample: samples[0] || null,
        };
      })),
      autoApproveCreators: getAutoApproveSetting(org.category),
    };
  });

  // GET unassigned creators available to partner with
  app.get('/store/creators/available', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);

    const assigned = await prisma.storeInfluencerAssignment.findMany({
      where: { organizationId: org.id },
      select: { influencerId: true },
    });
    const assignedIds = assigned.map((a: any) => a.influencerId);

    const available = await prisma.user.findMany({
      where: {
        role: 'INFLUENCER',
        status: 'ACTIVE',
        id: { notIn: assignedIds.length ? assignedIds : ['none'] },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        creatorCode: true,
        termsAcceptedAt: true,
        termsVersion: true,
        createdAt: true,
        influencerProfile: {
          select: { firstName: true, lastName: true, bio: true, city: true },
        },
        instagramConnection: {
          select: { username: true, status: true },
        },
      },
    });

    return {
      creators: available.map((inf: any) => ({
        id: inf.id,
        displayName: inf.displayName,
        email: inf.email,
        creatorCode: inf.creatorCode,
        instagramUsername: inf.instagramConnection?.username ?? null,
        termsAcceptedAt: inf.termsAcceptedAt ?? (inf.instagramConnection?.status === 'ACTIVE' ? inf.createdAt : null),
        termsVersion: inf.termsVersion ?? (inf.instagramConnection?.status === 'ACTIVE' ? 'v1.0' : null),
        influencerProfile: inf.influencerProfile,
      })),
    };
  });

  // POST /store/creators (Create & Onboard New Creator)
  app.post('/store/creators', async (req, reply) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const input = createCreatorSchema.parse(req.body);

    const email = input.email && input.email.trim() ? input.email.trim().toLowerCase() : null;
    let influencer: any = null;

    if (email) {
      influencer = await prisma.user.findUnique({
        where: { email },
        include: { influencerProfile: true, instagramConnection: true },
      });
      if (influencer && influencer.role !== 'INFLUENCER') {
        throw new AppError('EMAIL_IN_USE', `This email is already registered as a ${influencer.role.toLowerCase()}.`, 409);
      }
    }

    if (!influencer && input.phone && input.phone.trim()) {
      const existingPhone = await prisma.influencerProfile.findUnique({
        where: { phone: input.phone.trim() },
        select: { userId: true },
      });
      if (existingPhone) {
        throw new AppError('PHONE_IN_USE', 'An influencer profile already exists with this phone number.', 409);
      }
    }

    const rawPassword = input.password && input.password.trim() ? input.password.trim() : null;
    if (rawPassword && !email) {
      throw new AppError('EMAIL_REQUIRED_FOR_PASSWORD', 'An email address is required to set a portal login password.', 400);
    }
    const passwordHash = rawPassword ? await argon2.hash(rawPassword, passwordOptions) : null;

    if (!influencer) {
      const nameParts = input.displayName.trim().split(/\s+/);
      const firstName = nameParts[0] || input.displayName.trim();
      const lastName = nameParts.slice(1).join(' ') || firstName;

      const cleanHandle = input.instagramUsername
        ? input.instagramUsername.replace(/^@/, '').trim()
        : null;

      influencer = await prisma.user.create({
        data: {
          displayName: input.displayName.trim(),
          email: email || null,
          passwordHash: passwordHash || null,
          role: 'INFLUENCER',
          status: 'ACTIVE',
          influencerProfile: {
            create: {
              firstName,
              lastName,
              phone: input.phone?.trim() || null,
              bio: input.bio?.trim() || null,
              city: input.city?.trim() || null,
            },
          },
          ...(cleanHandle
            ? {
                instagramConnection: {
                  create: {
                    instagramUserId: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    username: cleanHandle,
                    displayName: input.displayName.trim(),
                    encryptedAccessToken: 'MANUAL_ONBOARDED',
                    status: 'ACTIVE',
                  },
                },
              }
            : {}),
        },
        include: {
          influencerProfile: true,
          instagramConnection: true,
        },
      });

      await ensureCreatorCode(prisma, influencer.id);
    } else {
      if (rawPassword && !influencer.passwordHash) {
        await prisma.user.update({
          where: { id: influencer.id },
          data: { passwordHash },
        });
      }
      await ensureCreatorCode(prisma, influencer.id);
    }

    // Assign to store with chosen compensationMode
    const assignment = await prisma.storeInfluencerAssignment.upsert({
      where: {
        organizationId_influencerId: {
          organizationId: org.id,
          influencerId: influencer.id,
        },
      },
      create: {
        organizationId: org.id,
        influencerId: influencer.id,
        compensationMode: input.compensationMode,
      },
      update: {
        compensationMode: input.compensationMode,
      },
    });

    let link: any = null;
    if (input.autoCreateLink !== false) {
      const existingLink = await prisma.affiliateLink.findFirst({
        where: { organizationId: org.id, creatorId: influencer.id, targetType: 'STORE' },
      });
      if (!existingLink) {
        const creatorCode = (await prisma.user.findUnique({ where: { id: influencer.id }, select: { creatorCode: true } }))?.creatorCode;
        const slug = `link_${creatorCode ? creatorCode.toLowerCase() : influencer.id.slice(-6)}_${Date.now().toString(36).slice(-4)}`;
        link = await prisma.affiliateLink.create({
          data: {
            organizationId: org.id,
            creatorId: influencer.id,
            targetType: 'STORE',
            destinationPath: '/',
            commissionType: 'PERCENTAGE',
            commissionRate: 10,
            slug,
          },
        });
      } else {
        link = existingLink;
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: influencer.id },
      include: {
        instagramConnection: true,
      },
    });

    return reply.code(201).send({
      ok: true,
      creator: {
        id: updatedUser.id,
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        status: updatedUser.status,
        creatorCode: updatedUser.creatorCode,
        instagramUsername: updatedUser.instagramConnection?.username ?? null,
        instagramStatus: updatedUser.instagramConnection?.status ?? null,
        assignedAt: assignment.createdAt || new Date().toISOString(),
        compensationMode: input.compensationMode,
        totalSales: 0,
        totalOrders: 0,
        totalCommissions: 0,
        activeLinks: link ? 1 : 0,
        approvalStatus: 'APPROVED',
      },
    });
  });

  // POST /store/creators/assign
  app.post('/store/creators/assign', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const body = req.body as { influencerId: string; compensationMode?: string };

    if (!body.influencerId) {
      throw new AppError('MISSING_INFLUENCER_ID', 'influencerId is required', 400);
    }

    const influencer = await prisma.user.findUnique({
      where: { id: body.influencerId, role: 'INFLUENCER' },
    });
    if (!influencer) {
      throw new AppError('INFLUENCER_NOT_FOUND', 'Influencer not found', 404);
    }

    const mode = ['COMMISSION', 'BARTER', 'HYBRID'].includes(body.compensationMode ?? '')
      ? body.compensationMode
      : 'COMMISSION';

    const assignment = await prisma.storeInfluencerAssignment.upsert({
      where: {
        organizationId_influencerId: {
          organizationId: org.id,
          influencerId: body.influencerId,
        },
      },
      create: {
        organizationId: org.id,
        influencerId: body.influencerId,
        compensationMode: mode,
      },
      update: {
        compensationMode: mode,
      },
    });

    return { ok: true, assignment };
  });

  // PATCH /store/creators/:creatorId/compensation-mode (Supports COMMISSION, BARTER, HYBRID)
  app.patch('/store/creators/:creatorId/compensation-mode', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };
    const { compensationMode } = req.body as { compensationMode?: string };

    if (!['COMMISSION', 'BARTER', 'HYBRID'].includes(compensationMode ?? '')) {
      throw new AppError('INVALID_COMPENSATION_MODE', 'compensationMode must be COMMISSION, BARTER, or HYBRID', 400);
    }

    const assignment = await prisma.storeInfluencerAssignment.updateMany({
      where: { organizationId: org.id, influencerId: creatorId },
      data: { compensationMode },
    });
    if (!assignment.count) {
      throw new AppError('CREATOR_NOT_FOUND', 'Creator is not assigned to this store.', 404);
    }

    return { ok: true, compensationMode };
  });

  // PATCH /store/creators/:creatorId/auto-commission (Influencer-wise Auto Commission On/Off Toggle)
  app.patch('/store/creators/:creatorId/auto-commission', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };
    const { autoCommission } = req.body as { autoCommission?: boolean };

    if (typeof autoCommission !== 'boolean') {
      throw new AppError('INVALID_INPUT', 'autoCommission must be a boolean', 400);
    }

    const assignment = await prisma.storeInfluencerAssignment.updateMany({
      where: { organizationId: org.id, influencerId: creatorId },
      data: { autoCommission },
    });
    if (!assignment.count) {
      throw new AppError('CREATOR_NOT_FOUND', 'Creator is not assigned to this store.', 404);
    }

    return { ok: true, autoCommission };
  });

  // POST /store/creators/:creatorId/manual-commission (Store admin adds a manual commission / bonus)
  app.post('/store/creators/:creatorId/manual-commission', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };
    const { amount, orderName, notes, status = 'APPROVED' } = req.body as {
      amount: number;
      orderName?: string;
      notes?: string;
      status?: 'APPROVED' | 'PENDING' | 'PAID';
    };

    const commAmount = Number(amount);
    if (isNaN(commAmount) || commAmount <= 0) {
      throw new AppError('INVALID_AMOUNT', 'Commission amount must be greater than 0', 400);
    }

    const creator = await prisma.user.findFirst({
      where: { id: creatorId, role: 'INFLUENCER' },
    });
    if (!creator) {
      throw new AppError('CREATOR_NOT_FOUND', 'Creator not found', 404);
    }

    let link = await prisma.affiliateLink.findFirst({
      where: { organizationId: org.id, creatorId: creator.id, status: 'ACTIVE' },
    });
    if (!link) {
      link = await prisma.affiliateLink.create({
        data: {
          organizationId: org.id,
          creatorId: creator.id,
          targetType: 'STORE',
          destinationPath: '/',
          commissionRate: 10,
          slug: `manual_${creator.creatorCode || creator.id.slice(-6)}_${Date.now().toString(36)}`,
        },
      });
    }

    const manualOrderId = `manual_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const order = await prisma.shopifyOrder.create({
      data: {
        organizationId: org.id,
        shopifyId: manualOrderId,
        name: orderName?.trim() || `Manual Commission #${Date.now().toString().slice(-4)}`,
        total: commAmount,
        currency: 'INR',
        financialStatus: 'paid',
        fulfillmentStatus: 'fulfilled',
        creatorCode: creator.creatorCode,
        affiliateLinkId: link.id,
        processedAt: new Date(),
      },
    });

    const commission = await prisma.affiliateCommission.create({
      data: {
        organizationId: org.id,
        linkId: link.id,
        creatorId: creator.id,
        shopifyOrderId: order.id,
        orderAmount: commAmount,
        commissionType: 'FIXED_AMOUNT',
        commissionRate: 0,
        amount: commAmount,
        status: ['APPROVED', 'PENDING', 'PAID'].includes(status) ? status : 'APPROVED',
      },
    });

    return { ok: true, commission, order };
  });

  // GET /store/creators/settings
  app.get('/store/creators/settings', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    return {
      autoApproveCreators: getAutoApproveSetting(org.category),
    };
  });

  // PATCH /store/creators/settings
  app.patch('/store/creators/settings', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const body = req.body as { autoApproveCreators: boolean };
    const autoApprove = Boolean(body.autoApproveCreators);

    const updatedCategory = encodeAutoApproveSetting(org.category, autoApprove);
    await prisma.organization.update({
      where: { id: org.id },
      data: { category: updatedCategory },
    });

    return {
      ok: true,
      autoApproveCreators: autoApprove,
    };
  });

  // POST /store/creators/:creatorId/approve
  app.post('/store/creators/:creatorId/approve', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };
    const { compensationMode } = (req.body as any) || {};

    const mode = ['COMMISSION', 'BARTER', 'HYBRID'].includes(compensationMode)
      ? compensationMode
      : 'COMMISSION';

    await prisma.storeInfluencerAssignment.upsert({
      where: {
        organizationId_influencerId: {
          organizationId: org.id,
          influencerId: creatorId,
        },
      },
      create: {
        organizationId: org.id,
        influencerId: creatorId,
        compensationMode: mode,
      },
      update: {
        compensationMode: mode,
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: creatorId,
          title: 'Store Partnership Approved',
          message: `Congratulations! ${org.name} has approved your partnership. You can now generate affiliate links!`,
          kind: 'AFFILIATE',
          link: '/influencer/affiliate',
        },
      });
    } catch {}

    return { ok: true, message: 'Creator approved successfully!' };
  });

  // DELETE /store/creators/:creatorId
  app.delete('/store/creators/:creatorId', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };

    await prisma.storeInfluencerAssignment.deleteMany({
      where: {
        organizationId: org.id,
        influencerId: creatorId,
      },
    });

    return { ok: true, message: 'Creator partnership removed.' };
  });

  // POST /store/creators/:creatorId/barter-sample (Send or update product sample tracking)
  app.post('/store/creators/:creatorId/barter-sample', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };
    const body = req.body as {
      productTitle: string;
      productId?: string;
      carrier?: string;
      trackingNumber?: string;
      shippingAddress?: string;
      status?: string;
    };

    if (!body.productTitle?.trim()) {
      throw new AppError('MISSING_PRODUCT_TITLE', 'Product title is required', 400);
    }

    // Find default or first campaign to attach
    let campaign = await prisma.campaign.findFirst({
      where: { organizationId: org.id, deletedAt: null },
    });

    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: {
          organizationId: org.id,
          title: `${org.name} Product Sampling`,
          brief: 'Complimentary brand sample gifted to creator partner.',
          category: 'Fashion & Lifestyle',
          campaignType: 'BARTER',
          objective: 'Product Review & Social Shoutout',
          deliverables: '1 Instagram Reel or Story Review',
          compensationType: 'BARTER',
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'PUBLISHED',
        },
      });
    }

    const sample = await prisma.barterSampleFulfillment.create({
      data: {
        organizationId: org.id,
        campaignId: campaign.id,
        creatorId,
        productId: body.productId || null,
        productTitle: body.productTitle.trim(),
        carrier: body.carrier || 'Standard Courier',
        trackingNumber: body.trackingNumber || null,
        shippingAddress: body.shippingAddress || null,
        status: (body.status as any) || 'SHIPPED',
        shippedAt: new Date(),
      },
    });

    // Notify creator
    await prisma.notification.create({
      data: {
        userId: creatorId,
        title: '🎁 Product Sample Dispatched!',
        message: `${org.name} has shipped your free sample of "${body.productTitle}"${body.trackingNumber ? ` via ${body.carrier || 'courier'} (Tracking: ${body.trackingNumber})` : ''}.`,
        kind: 'BARTER',
      },
    });

    return { ok: true, sample };
  });

  // GET store commissions roster
  app.get('/store/commissions', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const query = req.query as { status?: string; search?: string };

    const where: any = { organizationId: org.id };
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { creator: { displayName: { contains: query.search, mode: 'insensitive' } } },
        { creator: { creatorCode: { contains: query.search, mode: 'insensitive' } } },
        { shopifyOrder: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [rows, allCommissions, assignments] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              email: true,
              creatorCode: true,
              instagramConnection: { select: { username: true } },
            },
          },
          shopifyOrder: { select: { id: true, name: true, total: true, processedAt: true } },
          link: { select: { slug: true, commissionRate: true } },
        },
      }),
      prisma.affiliateCommission.findMany({
        where: { organizationId: org.id },
        select: { amount: true, status: true, orderAmount: true },
      }),
      prisma.storeInfluencerAssignment.findMany({
        where: { organizationId: org.id },
        select: { influencerId: true, compensationMode: true },
      }),
    ]);

    const barterMap = new Map(assignments.map((a: any) => [a.influencerId, a.compensationMode]));
    const payoutCommissions = allCommissions.filter((c: any) => c.status !== 'REVERSED');

    const pendingAmount = payoutCommissions
      .filter((c: any) => c.status === 'PENDING')
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const approvedAmount = payoutCommissions
      .filter((c: any) => c.status === 'APPROVED')
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const paidAmount = payoutCommissions
      .filter((c: any) => c.status === 'PAID')
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

    return {
      commissions: rows.map((r: any) => {
        const creatorMode = r.creatorId ? (barterMap.get(r.creatorId) || 'COMMISSION') : 'COMMISSION';
        return {
          id: r.id,
          orderId: r.shopifyOrderId,
          orderName: r.shopifyOrder?.name ?? `Order #${r.id.slice(-6)}`,
          orderAmount: Number(r.orderAmount),
          commissionRate: Number(r.commissionRate),
          amount: Number(r.amount),
          status: r.status,
          createdAt: r.createdAt,
          creatorMode,
          creator: r.creator
            ? {
                id: r.creator.id,
                name: r.creator.displayName,
                email: r.creator.email,
                code: r.creator.creatorCode,
                instagram: r.creator.instagramConnection?.username ?? null,
              }
            : null,
        };
      }),
      metrics: {
        pendingAmount,
        approvedAmount,
        paidAmount,
        totalCount: payoutCommissions.length,
        pendingCount: payoutCommissions.filter((c: any) => c.status === 'PENDING').length,
      },
    };
  });

  // POST /store/commissions/bulk-approve (1-Click approve all pending commissions)
  app.post('/store/commissions/bulk-approve', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);

    const pendingCommissions = await prisma.affiliateCommission.findMany({
      where: { organizationId: org.id, status: 'PENDING' },
    });

    if (!pendingCommissions.length) {
      return { ok: true, count: 0, message: 'No pending commissions to approve.' };
    }

    await prisma.affiliateCommission.updateMany({
      where: { organizationId: org.id, status: 'PENDING' },
      data: { status: 'APPROVED' },
    });

    // Notify affected creators
    const creatorIds = [...new Set(pendingCommissions.map((c: any) => c.creatorId).filter(Boolean))];
    for (const creatorId of creatorIds) {
      await prisma.notification.create({
        data: {
          userId: creatorId as string,
          title: '🎉 Commissions Approved!',
          message: `${org.name} has approved your pending sales commissions. Funds are now available for withdrawal!`,
          kind: 'COMMISSION',
        },
      });
    }

    return {
      ok: true,
      count: pendingCommissions.length,
      message: `Successfully approved ${pendingCommissions.length} pending commissions!`,
    };
  });

  // PATCH /store/commissions/:commissionId/status
  app.patch('/store/commissions/:commissionId/status', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { commissionId } = req.params as { commissionId: string };
    const body = req.body as { status: 'PENDING' | 'APPROVED' | 'PAID' | 'REVERSED' };

    if (!['PENDING', 'APPROVED', 'PAID', 'REVERSED'].includes(body.status)) {
      throw new AppError('INVALID_STATUS', 'Status must be PENDING, APPROVED, PAID, or REVERSED', 400);
    }

    const existing = await prisma.affiliateCommission.findFirst({
      where: { id: commissionId, organizationId: org.id },
    });
    if (!existing) {
      throw new AppError('COMMISSION_NOT_FOUND', 'Commission not found', 404);
    }

    const updated = await prisma.affiliateCommission.update({
      where: { id: commissionId },
      data: { status: body.status },
    });

    return { ok: true, commission: updated };
  });

  // GET /store/creators/:creatorId
  app.get('/store/creators/:creatorId', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };

    let assignment = await prisma.storeInfluencerAssignment.findFirst({
      where: { organizationId: org.id, influencerId: creatorId },
      include: {
        influencer: {
          include: {
            instagramConnection: true,
            influencerProfile: true,
            affiliateLinks: {
              where: { organizationId: org.id },
              include: {
                product: { select: { title: true, imageUrl: true } },
                collection: { select: { title: true } },
                _count: { select: { clicks: true } },
                commissions: { select: { id: true, orderAmount: true, amount: true, status: true } },
                trackedOrders: { select: { id: true, total: true, financialStatus: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
            affiliateCommissions: {
              where: { organizationId: org.id },
              include: {
                shopifyOrder: { select: { id: true, shopifyId: true, name: true, total: true, financialStatus: true, fulfillmentStatus: true, processedAt: true, email: true } },
                link: { select: { slug: true, commissionRate: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
            barterFulfillments: {
              where: { organizationId: org.id },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!assignment) {
      // Check if user exists with role INFLUENCER
      const infUser = await prisma.user.findFirst({
        where: { id: creatorId, role: 'INFLUENCER' },
      });
      if (infUser) {
        await prisma.storeInfluencerAssignment.upsert({
          where: {
            organizationId_influencerId: {
              organizationId: org.id,
              influencerId: creatorId,
            },
          },
          create: {
            organizationId: org.id,
            influencerId: creatorId,
            compensationMode: 'COMMISSION',
          },
          update: {},
        });
        assignment = await prisma.storeInfluencerAssignment.findFirst({
          where: { organizationId: org.id, influencerId: creatorId },
          include: {
            influencer: {
              include: {
                instagramConnection: true,
                influencerProfile: true,
                affiliateLinks: {
                  where: { organizationId: org.id },
                  include: {
                    product: { select: { title: true, imageUrl: true } },
                    collection: { select: { title: true } },
                    _count: { select: { clicks: true } },
                    commissions: { select: { id: true, orderAmount: true, amount: true, status: true } },
                    trackedOrders: { select: { id: true, total: true, financialStatus: true } },
                  },
                  orderBy: { createdAt: 'desc' },
                },
                affiliateCommissions: {
                  where: { organizationId: org.id },
                  include: {
                    shopifyOrder: { select: { id: true, shopifyId: true, name: true, total: true, financialStatus: true, fulfillmentStatus: true, processedAt: true, email: true } },
                    link: { select: { slug: true, commissionRate: true } },
                  },
                  orderBy: { createdAt: 'desc' },
                },
                barterFulfillments: {
                  where: { organizationId: org.id },
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        });
      }
    }
    if (!assignment) throw new AppError('CREATOR_NOT_FOUND', 'Creator is not assigned to this store.', 404);

    // 1. Pre-fetch Store Referral Config, Custom Discounts, Assigned Products, and Instagram Statistics in parallel
    const [storeConfig, customDiscounts, assignedProductIds, instagramStatistics] = await Promise.all([
      prisma.storeReferralConfig.findUnique({
        where: { organizationId: org.id },
        select: {
          multiProductCommissionMode: true,
          fallbackCommissionRate: true,
          fixedTokensEnabled: true,
          percentageEnabled: true,
          fixedTokensPerOrder: true,
        },
      }),
      prisma.discountCode.findMany({
        where: { organizationId: org.id, creatorId },
        select: { code: true },
      }),
      getAssignedProductIds(prisma, creatorId, org.id),
      assignment.influencer.instagramConnection?.status === 'ACTIVE'
        ? getInstagramProfile(decryptToken(assignment.influencer.instagramConnection.encryptedAccessToken)).catch(() => null)
        : Promise.resolve(null),
    ]);

    const inf = assignment.influencer;
    const rawLinks = inf.affiliateLinks ?? [];
    const linkIds = rawLinks.map((l: any) => l.id);

    // Ensure creator has at least one active default affiliate link for tracking
    let defaultLink = rawLinks.find((l: any) => l.targetType === 'STORE' && l.status === 'ACTIVE') || rawLinks[0];
    if (!defaultLink) {
      const slug = `link_${inf.creatorCode ? inf.creatorCode.toLowerCase() : inf.id.slice(-6)}_${Date.now().toString(36).slice(-4)}`;
      defaultLink = await prisma.affiliateLink.create({
        data: {
          organizationId: org.id,
          creatorId: inf.id,
          targetType: 'STORE',
          destinationPath: '/',
          commissionType: 'PERCENTAGE',
          commissionRate: 10,
          slug,
        },
      });
      rawLinks.push(defaultLink);
      linkIds.push(defaultLink.id);
    }

    // Include creatorCode, base code, instagram handle, and all assigned discount codes
    const creatorCodes = [
      ...(inf.creatorCode ? [inf.creatorCode] : []),
      ...customDiscounts.map((d: any) => d.code).filter(Boolean),
    ];
    if (inf.instagramConnection?.username) {
      creatorCodes.push(inf.instagramConnection.username);
    }
    if (inf.creatorCode && /_pro$/i.test(inf.creatorCode)) {
      creatorCodes.push(inf.creatorCode.replace(/_pro$/i, ''));
    }

    const orderOrClauses: any[] = [
      { affiliateCommissions: { some: { creatorId: inf.id, organizationId: org.id } } },
    ];
    for (const code of creatorCodes) {
      orderOrClauses.push({ creatorCode: { equals: code, mode: 'insensitive' } });
    }
    if (linkIds.length > 0) {
      orderOrClauses.push({ affiliateLinkId: { in: linkIds } });
    }

    const shopifyOrders = await prisma.shopifyOrder.findMany({
      where: {
        organizationId: org.id,
        OR: orderOrClauses,
      },
      include: {
        affiliateCommissions: {
          where: { organizationId: org.id },
          include: {
            link: { select: { slug: true, commissionRate: true } },
          },
        },
        affiliateLink: {
          select: { id: true, slug: true, commissionRate: true, commissionType: true, commissionAmount: true },
        },
      },
      orderBy: { processedAt: 'desc' },
    });

    const isBarter = (assignment as any).compensationMode === 'BARTER';
    const autoCommission = (assignment as any).autoCommission ?? true;
    const assignedProductSet = new Set<string>(assignedProductIds);

    // High-performance batch reconciliation: calculates commission for any order missing one immediately
    await reconcileOrdersCommissions(
      prisma,
      org.id,
      inf.id,
      shopifyOrders,
      defaultLink,
      storeConfig,
      assignedProductSet,
      autoCommission,
      isBarter
    );

    const totalOrders = shopifyOrders.length;
    const totalSales = shopifyOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

    const totalCommissions = shopifyOrders.reduce((sum: number, o: any) => {
      const comm = o.affiliateCommissions?.[0];
      if (comm && comm.status === 'REVERSED') return sum;
      if (comm) return sum + Number(comm.amount || 0);
      const rate = Number(defaultLink?.commissionRate || 10);
      return sum + ((Number(o.total || 0) * rate) / 100);
    }, 0);

    const baseUrl = getFrontendBaseUrl(req);
    const totalClicks = rawLinks.reduce((sum: number, l: any) => sum + Number(l._count?.clicks ?? 0), 0);
    const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;

    const links = rawLinks.map((l: any) => {
      const linkComms = (l.commissions ?? []).filter((c: any) => c.status !== 'REVERSED');
      const clicks = Number(l._count?.clicks ?? 0);
      const orders = linkComms.length;
      const rev = linkComms.reduce((sum: number, c: any) => sum + Number(c.orderAmount || 0), 0);
      return {
        id: l.id,
        slug: l.slug,
        url: `${baseUrl}/r/${l.slug}`,
        targetType: l.targetType,
        product: l.product?.title ?? null,
        collection: l.collection?.title ?? null,
        commissionType: l.commissionType ?? 'PERCENTAGE',
        commissionRate: Number(l.commissionRate),
        commissionAmount: l.commissionAmount !== null && l.commissionAmount !== undefined ? Number(l.commissionAmount) : null,
        status: l.status,
        clicks,
        orders,
        revenue: rev,
        createdAt: l.createdAt,
      };
    });

    const barterFulfillments = (inf.barterFulfillments ?? []).map((b: any) => ({
      id: b.id,
      productTitle: b.productTitle,
      status: b.status,
      trackingNumber: b.trackingNumber,
      carrier: b.carrier,
      shippedAt: b.shippedAt,
      deliveredAt: b.deliveredAt,
      createdAt: b.createdAt,
    }));

    const recentOrders = shopifyOrders.map((order: any) => {
      const comm = order.affiliateCommissions?.[0];
      const linkSlug = comm?.link?.slug || order.affiliateLink?.slug || defaultLink?.slug || null;
      const commissionRate = comm ? Number(comm.commissionRate) : Number(defaultLink?.commissionRate || 10);
      const amount = comm ? Number(comm.amount) : ((Number(order.total || 0) * commissionRate) / 100);
      const status = comm ? comm.status : 'PENDING';

      return {
        id: comm?.id || order.id,
        orderId: order.id,
        shopifyId: order.shopifyId,
        orderName: order.name || 'Order',
        customerEmail: order.email || null,
        orderAmount: Number(order.total || 0),
        commissionRate,
        amount,
        status,
        financialStatus: order.financialStatus || 'PAID',
        fulfillmentStatus: order.fulfillmentStatus || 'UNFULFILLED',
        linkSlug,
        processedAt: order.processedAt || order.createdAt,
      };
    });

    const mode = assignment.compensationMode ?? 'COMMISSION';

    return {
      creator: {
        id: inf.id,
        displayName: inf.displayName,
        email: inf.email,
        status: inf.status,
        creatorCode: inf.creatorCode,
        createdAt: inf.createdAt,
        termsAcceptedAt: inf.termsAcceptedAt ?? (inf.instagramConnection?.status === 'ACTIVE' ? inf.createdAt : null),
        termsVersion: inf.termsVersion ?? (inf.instagramConnection?.status === 'ACTIVE' ? 'v1.0' : null),
        instagramUsername: inf.instagramConnection?.username ?? null,
        instagramFollowersCount: instagramStatistics?.followers_count ?? null,
        instagramMediaCount: instagramStatistics?.media_count ?? null,
        assignedProductIds,
        compensationMode: mode,
        autoCommission: (assignment as any).autoCommission ?? true,
        profile: inf.influencerProfile,
      },
      assignedAt: assignment.createdAt,
      compensationMode: mode,
      autoCommission: (assignment as any).autoCommission ?? true,
      assignedProductIds,
      instagramStatistics,
      metrics: {
        totalSales,
        totalOrders,
        totalCommissions: mode === 'BARTER' ? 0 : totalCommissions,
        totalClicks,
        conversionRate: Math.round(conversionRate * 10) / 10,
        activeLinksCount: links.filter((l: any) => l.status === 'ACTIVE').length,
        sampleCount: barterFulfillments.length,
      },
      links,
      recentOrders,
      barterFulfillments,
    };
  });

  // PUT /store/creators/:creatorId/products
  app.put('/store/creators/:creatorId/products', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };
    const { productIds } = req.body as { productIds: string[] };
    if (!Array.isArray(productIds)) throw new AppError('INVALID_INPUT', 'productIds must be an array', 400);
    const assignedProductIds = await setCreatorProductAssignments(prisma, org.id, creatorId, productIds);
    return { ok: true, assignedProductIds };
  });

  // POST /store/creators/:creatorId/recalculate - Force re-calculate commissions for all orders of this creator
  app.post('/store/creators/:creatorId/recalculate', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const { creatorId } = req.params as { creatorId: string };

    const assignment = await prisma.storeInfluencerAssignment.findFirst({
      where: { organizationId: org.id, influencerId: creatorId },
      include: {
        influencer: {
          include: {
            affiliateLinks: { where: { organizationId: org.id } },
          },
        },
      },
    });

    if (!assignment) throw new AppError('CREATOR_NOT_FOUND', 'Creator is not assigned to this store.', 404);

    const inf = assignment.influencer;
    const rawLinks = inf.affiliateLinks ?? [];
    const linkIds = rawLinks.map((l: any) => l.id);
    const defaultLink = rawLinks.find((l: any) => l.targetType === 'STORE' && l.status === 'ACTIVE') || rawLinks[0];

    const [storeConfig, customDiscounts, assignedProductIds] = await Promise.all([
      prisma.storeReferralConfig.findUnique({
        where: { organizationId: org.id },
        select: {
          multiProductCommissionMode: true,
          fallbackCommissionRate: true,
          fixedTokensEnabled: true,
          percentageEnabled: true,
          fixedTokensPerOrder: true,
        },
      }),
      prisma.discountCode.findMany({
        where: { organizationId: org.id, creatorId },
        select: { code: true },
      }),
      getAssignedProductIds(prisma, creatorId, org.id),
    ]);

    const creatorCodes = [
      ...(inf.creatorCode ? [inf.creatorCode] : []),
      ...customDiscounts.map((d: any) => d.code).filter(Boolean),
    ];
    if (inf.instagramConnection?.username) {
      creatorCodes.push(inf.instagramConnection.username);
    }
    if (inf.creatorCode && /_pro$/i.test(inf.creatorCode)) {
      creatorCodes.push(inf.creatorCode.replace(/_pro$/i, ''));
    }

    const orderOrClauses: any[] = [
      { affiliateCommissions: { some: { creatorId: inf.id, organizationId: org.id } } },
    ];
    for (const code of creatorCodes) {
      orderOrClauses.push({ creatorCode: { equals: code, mode: 'insensitive' } });
    }
    if (linkIds.length > 0) {
      orderOrClauses.push({ affiliateLinkId: { in: linkIds } });
    }

    const shopifyOrders = await prisma.shopifyOrder.findMany({
      where: { organizationId: org.id, OR: orderOrClauses },
      include: {
        affiliateCommissions: { where: { organizationId: org.id } },
        affiliateLink: true,
      },
      orderBy: { processedAt: 'desc' },
    });

    const isBarter = (assignment as any).compensationMode === 'BARTER';
    const autoCommission = (assignment as any).autoCommission ?? true;
    const assignedProductSet = new Set<string>(assignedProductIds);

    let recalculatedCount = 0;
    await Promise.all(
      shopifyOrders.map(async (order: any) => {
        const linkToUse = order.affiliateLink || defaultLink;
        if (!linkToUse?.id) return;

        const calc = calculateOrderCommission(
          order,
          linkToUse,
          storeConfig,
          assignedProductSet,
          autoCommission,
          isBarter
        );

        await prisma.affiliateCommission.upsert({
          where: { shopifyOrderId: order.id },
          create: {
            organizationId: org.id,
            linkId: linkToUse.id,
            creatorId: inf.id,
            shopifyOrderId: order.id,
            orderAmount: Number(order.total || 0),
            commissionType: calc.commissionType,
            commissionRate: calc.commissionRate,
            amount: calc.amount,
            status: calc.status,
          },
          update: {
            amount: calc.amount,
            commissionRate: calc.commissionRate,
            commissionType: calc.commissionType,
            linkId: linkToUse.id,
            creatorId: inf.id,
          },
        });
        recalculatedCount++;
      })
    );

    return { ok: true, recalculatedCount, totalOrders: shopifyOrders.length };
  });

  // POST /store/creators/recalculate - Force recalculate commissions for all creators in the store roster
  app.post('/store/creators/recalculate', async (req) => {
    const actor = requireRole(req, ['STORE_OWNER']);
    const org = await organization(actor.userId);
    const result = await reconcileStoreRosterCommissions(prisma, org.id, { forceRecalculate: true });
    return { ok: true, recalculatedCount: result.reconciledCount };
  });
};
