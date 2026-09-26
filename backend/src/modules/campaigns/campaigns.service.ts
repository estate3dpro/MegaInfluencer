import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';

import { AppError } from '../../shared/errors/app-error.js';
import { campaignInputSchema } from './campaigns.schema.js';

export const decisionSchema = z.enum(['accept', 'decline']);
export const campaignStatusSchema = z.enum(['PUBLISHED', 'PAUSED']);
type Input = z.infer<typeof campaignInputSchema>;

async function org(app: FastifyInstance, userId: string) {
  const value = await app.prisma.organization.findFirst({ where: { ownerId: userId } });
  if (!value) throw new AppError('ORGANIZATION_NOT_FOUND', 'Create a store workspace first.', 404);
  return value;
}

async function campaignData(app: FastifyInstance, organizationId: string, input: Input) {
  const productId = input.productId ?? null;
  if (productId) {
    const product = await app.prisma.shopifyProduct.findFirst({
      where: { id: productId, organizationId },
      select: { id: true },
    });
    if (!product) throw new AppError('CAMPAIGN_PRODUCT_NOT_FOUND', 'Choose a product from your store catalog.', 400);
  }
  return { ...input, productId };
}

async function assignCampaignProduct(
  tx: any,
  campaign: {
    id?: string;
    productId: string | null;
    organizationId: string;
    compensationType?: string;
    budgetMin?: number | null;
    budgetMax?: number | null;
    currency?: string;
  },
  influencerId: string,
  proposedRate?: number | null
) {
  if (campaign.productId) {
    await tx.productInfluencerAssignment.upsert({
      where: { productId_influencerId: { productId: campaign.productId, influencerId } },
      create: { productId: campaign.productId, organizationId: campaign.organizationId, influencerId },
      update: {},
    });
  }

  const compType = (campaign.compensationType ?? 'FIXED').toUpperCase();

  // 1. Create Affiliate Link ONLY for COMMISSION and HYBRID models (Barter & Fixed deals do NOT earn sales commissions)
  if (compType === 'COMMISSION' || compType === 'HYBRID') {
    const activeLink = await tx.affiliateLink.findFirst({
      where: {
        organizationId: campaign.organizationId,
        productId: campaign.productId ?? undefined,
        creatorId: influencerId,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true },
    });
    if (!activeLink) {
      let handle: string | null = null;
      if (campaign.productId) {
        const product = await tx.shopifyProduct.findUnique({
          where: { id: campaign.productId },
          select: { handle: true },
        });
        handle = product?.handle ?? null;
      }
      await tx.affiliateLink.create({
        data: {
          organizationId: campaign.organizationId,
          creatorId: influencerId,
          productId: campaign.productId,
          targetType: campaign.productId ? 'PRODUCT' : 'STORE',
          destinationPath: handle ? `/products/${handle}` : '/',
          commissionRate: 10,
          slug: randomBytes(9).toString('base64url'),
        },
      });
    }
  }

  // 2. Fixed Fee or Hybrid Base Payout creation
  if (campaign.id && (compType === 'FIXED' || compType === 'HYBRID')) {
    const amount = proposedRate ?? campaign.budgetMin ?? campaign.budgetMax ?? (compType === 'HYBRID' ? 500 : 1000);
    const existingPayout = await tx.campaignPayout.findFirst({
      where: { campaignId: campaign.id, creatorId: influencerId },
    });
    if (!existingPayout) {
      await tx.campaignPayout.create({
        data: {
          organizationId: campaign.organizationId,
          campaignId: campaign.id,
          creatorId: influencerId,
          type: compType === 'HYBRID' ? 'HYBRID_BASE' : 'FIXED_FEE',
          amount,
          currency: campaign.currency ?? 'INR',
          status: 'PENDING',
          notes: `Campaign compensation for ${compType} deal`,
        },
      });
    }
  }

  // 3. Barter Sample Fulfillment record creation
  if (campaign.id && compType === 'BARTER') {
    const existingBarter = await tx.barterSampleFulfillment.findFirst({
      where: { campaignId: campaign.id, creatorId: influencerId },
    });
    if (!existingBarter) {
      let productTitle = 'Product Sample';
      if (campaign.productId) {
        const p = await tx.shopifyProduct.findUnique({ where: { id: campaign.productId }, select: { title: true } });
        if (p?.title) productTitle = p.title;
      }
      await tx.barterSampleFulfillment.create({
        data: {
          organizationId: campaign.organizationId,
          campaignId: campaign.id,
          creatorId: influencerId,
          productId: campaign.productId,
          productTitle,
          status: 'PENDING',
        },
      });
    }
  }
}

export async function listStore(app: FastifyInstance, userId: string) {
  const organization = await org(app, userId);
  return app.prisma.campaign.findMany({
    where: { organizationId: organization.id, deletedAt: null },
    include: { product: { select: { id: true, title: true, imageUrl: true, price: true } }, _count: { select: { applications: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(app: FastifyInstance, userId: string, input: Input) {
  const organization = await org(app, userId);
  return app.prisma.campaign.create({ data: { ...(await campaignData(app, organization.id, input)), organizationId: organization.id } });
}

async function own(app: FastifyInstance, userId: string, id: string) {
  const organization = await org(app, userId);
  const campaign = await app.prisma.campaign.findFirst({
    where: { id, organizationId: organization.id, deletedAt: null },
  });
  if (!campaign) throw new AppError('CAMPAIGN_NOT_FOUND', 'Campaign was not found.', 404);
  return campaign;
}

export async function getStoreCampaign(app: FastifyInstance, userId: string, id: string) {
  return own(app, userId, id);
}

export async function eligibleInfluencers(app: FastifyInstance, userId: string, campaignId: string) {
  await own(app, userId, campaignId);
  const influencers = await app.prisma.user.findMany({
    where: { role: 'INFLUENCER', status: 'ACTIVE' },
    select: {
      id: true,
      displayName: true,
      email: true,
      instagramConnection: { select: { username: true, displayName: true } },
      campaignAssignments: { where: { campaignId }, select: { id: true } },
    },
    orderBy: { displayName: 'asc' },
    take: 200,
  });
  return influencers.map(({ instagramConnection, campaignAssignments, ...influencer }) => ({
    ...influencer,
    instagramUsername: instagramConnection?.username ?? null,
    assigned: campaignAssignments.length > 0,
  }));
}

export async function manuallyAssign(app: FastifyInstance, userId: string, campaignId: string, influencerId: string) {
  const campaign = await own(app, userId, campaignId);
  const influencer = await app.prisma.user.findFirst({
    where: { id: influencerId, role: 'INFLUENCER', status: 'ACTIVE' },
    select: { id: true, displayName: true },
  });
  if (!influencer) throw new AppError('INFLUENCER_NOT_FOUND', 'Choose an active influencer.', 404);

  return app.prisma.$transaction(async (tx) => {
    const assignment = await tx.campaignAssignment.upsert({
      where: { campaignId_influencerId: { campaignId, influencerId } },
      create: { campaignId, influencerId },
      update: { status: 'ASSIGNED' },
    });
    await assignCampaignProduct(tx, campaign, influencerId);
    await tx.storeInfluencerAssignment.upsert({
      where: { organizationId_influencerId: { organizationId: campaign.organizationId, influencerId } },
      create: { organizationId: campaign.organizationId, influencerId },
      update: {},
    });
    await tx.notification.createMany({
      data: [
        {
          userId: influencerId,
          title: 'You were assigned to a campaign',
          message: `You have been assigned to ${campaign.title}. Review the brief in Campaigns.`,
          kind: 'CAMPAIGN',
          link: '/influencer/campaigns',
        },
        {
          userId,
          title: 'Creator assigned',
          message: `${influencer.displayName} is now assigned to ${campaign.title}.`,
          kind: 'CAMPAIGN',
          link: '/store-admin/campaigns',
        },
      ],
    });
    return assignment;
  });
}

export async function unassign(app: FastifyInstance, userId: string, campaignId: string, influencerId: string) {
  const campaign = await own(app, userId, campaignId);
  const deleted = await app.prisma.campaignAssignment.deleteMany({ where: { campaignId, influencerId } });
  if (!deleted.count) throw new AppError('CAMPAIGN_ASSIGNMENT_NOT_FOUND', 'Creator is not assigned to this campaign.', 404);
  await app.prisma.notification.create({ data: { userId: influencerId, title: 'Campaign assignment removed', message: `You are no longer assigned to ${campaign.title}.`, kind: 'CAMPAIGN', link: '/influencer/campaigns' } });
}

export async function update(app: FastifyInstance, userId: string, id: string, input: Input) {
  const campaign = await own(app, userId, id);
  return app.prisma.campaign.update({ where: { id }, data: await campaignData(app, campaign.organizationId, input) });
}

export async function publish(app: FastifyInstance, userId: string, id: string) {
  return setStatus(app, userId, id, 'PUBLISHED');
}

export async function setStatus(
  app: FastifyInstance,
  userId: string,
  id: string,
  status: z.infer<typeof campaignStatusSchema>,
) {
  const campaign = await own(app, userId, id);
  return app.prisma.campaign.update({
    where: { id },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' && !campaign.publishedAt ? new Date() : undefined,
    },
  });
}

export async function softDelete(app: FastifyInstance, userId: string, id: string) {
  await own(app, userId, id);
  return app.prisma.campaign.update({
    where: { id },
    data: { status: 'ARCHIVED', deletedAt: new Date() },
  });
}

export async function applications(app: FastifyInstance, userId: string, id: string) {
  await own(app, userId, id);
  return app.prisma.campaignApplication.findMany({
    where: { campaignId: id },
    include: {
      influencer: {
        select: { id: true, displayName: true, email: true, instagramConnection: { select: { username: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function assignedCampaigns(app: FastifyInstance, userId: string) {
  return app.prisma.campaignAssignment.findMany({
    where: { influencerId: userId, status: 'ASSIGNED', campaign: { is: { deletedAt: null } } },
    include: { campaign: { include: { organization: { select: { name: true, logoUrl: true } }, product: { select: { id: true, title: true, imageUrl: true, price: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function decide(
  app: FastifyInstance,
  userId: string,
  campaignId: string,
  applicationId: string,
  decision: z.infer<typeof decisionSchema>,
) {
  const campaign = await own(app, userId, campaignId);
  const application = await app.prisma.campaignApplication.findFirst({ where: { id: applicationId, campaignId } });
  if (!application) throw new AppError('APPLICATION_NOT_FOUND', 'Application was not found.', 404);

  return app.prisma.$transaction(async (tx) => {
    const updated = await tx.campaignApplication.update({
      where: { id: application.id },
      data: { status: decision === 'accept' ? 'ACCEPTED' : 'DECLINED', decidedAt: new Date() },
    });
    if (decision === 'accept') {
      await tx.campaignAssignment.upsert({
        where: { campaignId_influencerId: { campaignId, influencerId: application.influencerId } },
        create: { campaignId, influencerId: application.influencerId },
        update: { status: 'ASSIGNED' },
      });
      await tx.storeInfluencerAssignment.upsert({
        where: { organizationId_influencerId: { organizationId: campaign.organizationId, influencerId: application.influencerId } },
        create: { organizationId: campaign.organizationId, influencerId: application.influencerId },
        update: {},
      });
      await assignCampaignProduct(tx, campaign, application.influencerId, application.proposedRate);
      await tx.notification.createMany({
        data: [
          {
            userId: application.influencerId,
            title: 'Campaign application approved',
            message: `Your application for ${campaign.title} was approved. The campaign is now in your workspace.`,
            kind: 'CAMPAIGN',
            link: '/influencer/campaigns',
          },
          {
            userId,
            title: 'Creator application approved',
            message: `You approved an application for ${campaign.title}.`,
            kind: 'CAMPAIGN',
            link: `/store-admin/campaigns`,
          },
        ],
      });
    } else {
      await tx.notification.create({
        data: {
          userId: application.influencerId,
          title: 'Campaign application update',
          message: `Your application for ${campaign.title} was not selected this time.`,
          kind: 'CAMPAIGN',
          link: '/influencer/discover',
        },
      });
    }
    return updated;
  });
}

export async function discover(app: FastifyInstance, userId: string) {
  return app.prisma.campaign.findMany({
    where: { status: 'PUBLISHED', deletedAt: null, applicationDeadline: { gt: new Date() } },
    include: {
      organization: { select: { name: true, logoUrl: true } },
      product: { select: { id: true, title: true, imageUrl: true, price: true } },
      applications: { where: { influencerId: userId }, select: { id: true, status: true } },
    },
    orderBy: { publishedAt: 'desc' },
  });
}

export async function apply(
  app: FastifyInstance,
  userId: string,
  campaignId: string,
  input: { pitch: string; proposedRate?: number },
) {
  const campaign = await app.prisma.campaign.findFirst({
    where: { id: campaignId, status: 'PUBLISHED', deletedAt: null, applicationDeadline: { gt: new Date() } },
    include: { organization: { select: { ownerId: true, name: true } } },
  });
  if (!campaign) throw new AppError('CAMPAIGN_NOT_AVAILABLE', 'This campaign is no longer accepting applications.', 409);
  try {
    const application = await app.prisma.campaignApplication.create({ data: { campaignId, influencerId: userId, ...input } });
    await app.prisma.notification.create({
      data: {
        userId: campaign.organization.ownerId,
        title: 'New campaign application',
        message: `A creator applied to ${campaign.title}. Review the application to accept or decline it.`,
        kind: 'CAMPAIGN',
        link: '/store-admin/campaigns',
      },
    });
    return application;
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      throw new AppError('ALREADY_APPLIED', 'You have already applied to this campaign.', 409);
    }
    throw error;
  }
}

export async function listStorePayouts(app: FastifyInstance, userId: string) {
  const organization = await org(app, userId);
  return app.prisma.campaignPayout.findMany({
    where: { organizationId: organization.id },
    include: {
      creator: { select: { id: true, displayName: true, email: true } },
      campaign: { select: { id: true, title: true, compensationType: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updatePayoutStatus(app: FastifyInstance, userId: string, payoutId: string, status: any) {
  const organization = await org(app, userId);
  const payout = await app.prisma.campaignPayout.findFirst({
    where: { id: payoutId, organizationId: organization.id },
  });
  if (!payout) throw new AppError('PAYOUT_NOT_FOUND', 'Payout record not found.', 404);
  return app.prisma.campaignPayout.update({
    where: { id: payoutId },
    data: { status },
  });
}

export async function listStoreBarterFulfillments(app: FastifyInstance, userId: string) {
  const organization = await org(app, userId);
  return app.prisma.barterSampleFulfillment.findMany({
    where: { organizationId: organization.id },
    include: {
      creator: { select: { id: true, displayName: true, email: true } },
      campaign: { select: { id: true, title: true } },
      product: { select: { id: true, title: true, imageUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateBarterFulfillment(
  app: FastifyInstance,
  userId: string,
  fulfillmentId: string,
  data: { trackingNumber?: string; carrier?: string; status?: any }
) {
  const organization = await org(app, userId);
  const item = await app.prisma.barterSampleFulfillment.findFirst({
    where: { id: fulfillmentId, organizationId: organization.id },
  });
  if (!item) throw new AppError('FULFILLMENT_NOT_FOUND', 'Barter fulfillment record not found.', 404);
  return app.prisma.barterSampleFulfillment.update({
    where: { id: fulfillmentId },
    data: {
      ...data,
      shippedAt: data.status === 'SHIPPED' && !item.shippedAt ? new Date() : undefined,
      deliveredAt: (data.status === 'DELIVERED' || data.status === 'COMPLETED') && !item.deliveredAt ? new Date() : undefined,
    },
  });
}
