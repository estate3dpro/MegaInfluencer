import argon2 from 'argon2';
import type { FastifyInstance } from 'fastify';

import { AppError } from '../../shared/errors/app-error.js';
import { getInstagramProfile } from '../instagram/instagram.client.js';
import { decryptToken } from '../instagram/instagram.crypto.js';

const pageSize = 20;
const passwordOptions = { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 };

export async function listAdminInfluencers(
  app: FastifyInstance,
  input: { page: number; search?: string; status?: 'ACTIVE' | 'SUSPENDED' },
) {
  const where = {
    role: 'INFLUENCER' as const,
    ...(input.status ? { status: input.status } : {}),
    ...(input.search
      ? {
          OR: [
            { displayName: { contains: input.search, mode: 'insensitive' as const } },
            { email: { contains: input.search, mode: 'insensitive' as const } },
            { instagramConnection: { username: { contains: input.search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const [influencers, total] = await Promise.all([
    app.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (input.page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        displayName: true,
        email: true,
        status: true,
        createdAt: true,
        instagramConnection: { select: { instagramUserId: true, username: true, status: true } },
      },
    }),
    app.prisma.user.count({ where }),
  ]);

  return {
    influencers: influencers.map(({ instagramConnection, ...influencer }) => ({
      ...influencer,
      instagramUsername: instagramConnection?.username ?? null,
      instagramId: instagramConnection?.instagramUserId ?? null,
      instagramConnectionStatus: instagramConnection?.status ?? null,
    })),
    pagination: { page: input.page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getAdminInfluencer(app: FastifyInstance, influencerId: string) {
  const influencer = await app.prisma.user.findFirst({
    where: { id: influencerId, role: 'INFLUENCER' },
    select: {
      id: true,
      displayName: true,
      email: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      instagramConnection: {
        select: {
          instagramUserId: true,
          username: true,
          displayName: true,
          status: true,
          tokenExpiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!influencer) throw new AppError('INFLUENCER_NOT_FOUND', 'Influencer not found.', 404);
  return influencer;
}

export async function updateAdminInfluencerStatus(
  app: FastifyInstance,
  adminId: string,
  influencerId: string,
  status: 'ACTIVE' | 'SUSPENDED',
) {
  if (adminId === influencerId) throw new AppError('INVALID_STATUS_CHANGE', 'You cannot change your own status.', 400);
  await getAdminInfluencer(app, influencerId);
  return app.prisma.user.update({ where: { id: influencerId }, data: { status }, select: { id: true, status: true, updatedAt: true } });
}

/** Admin-only migration path for creators who previously used Instagram-only access. */
export async function provisionAdminInfluencerCredentials(
  app: FastifyInstance,
  influencerId: string,
  input: { email: string; password: string },
) {
  const influencer = await getAdminInfluencer(app, influencerId);
  const passwordHash = await argon2.hash(input.password, passwordOptions);
  const nameParts = influencer.displayName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Influencer';
  const lastName = nameParts.slice(1).join(' ') || 'Profile';

  try {
    return await app.prisma.user.update({
      where: { id: influencerId },
      data: {
        email: input.email,
        passwordHash,
        influencerProfile: {
          upsert: {
            create: { firstName, lastName },
            update: {},
          },
        },
      },
      select: { id: true, email: true, updatedAt: true },
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new AppError('EMAIL_IN_USE', 'This email is already used by another account.', 409);
    }
    throw error;
  }
}

/**
 * Consolidate a duplicate creator into the account the admin has chosen to keep.
 * Data owned by the duplicate is reassigned first; deleting the duplicate then
 * only removes its now-empty profile shell and any duplicate join records.
 */
export async function mergeAdminInfluencers(
  app: FastifyInstance,
  keepInfluencerId: string,
  duplicateInfluencerId: string,
) {
  if (keepInfluencerId === duplicateInfluencerId) {
    throw new AppError('INVALID_MERGE', 'Choose a different influencer account to merge.', 400);
  }

  return app.prisma.$transaction(async (tx) => {
    const [keep, duplicate] = await Promise.all([
      tx.user.findFirst({ where: { id: keepInfluencerId, role: 'INFLUENCER' }, include: { instagramConnection: true, influencerProfile: true } }),
      tx.user.findFirst({ where: { id: duplicateInfluencerId, role: 'INFLUENCER' }, include: { instagramConnection: true, influencerProfile: true } }),
    ]);
    if (!keep || !duplicate) throw new AppError('INFLUENCER_NOT_FOUND', 'Influencer not found.', 404);

    // A real Instagram identity must never be silently discarded or overwritten.
    if (keep.instagramConnection && duplicate.instagramConnection) {
      throw new AppError('INSTAGRAM_CONNECTION_CONFLICT', 'Both accounts have an Instagram connection. Disconnect one account before merging.', 409);
    }

    // Keep the retained account's email when present; otherwise carry over the duplicate's login.
    if (!keep.email && duplicate.email) {
      // The duplicate still owns the unique address until this transaction completes.
      await tx.user.update({ where: { id: duplicate.id }, data: { email: null } });
      await tx.user.update({ where: { id: keep.id }, data: { email: duplicate.email, passwordHash: duplicate.passwordHash } });
    }
    if (!keep.creatorCode && duplicate.creatorCode) {
      await tx.user.update({ where: { id: duplicate.id }, data: { creatorCode: null } });
      await tx.user.update({ where: { id: keep.id }, data: { creatorCode: duplicate.creatorCode } });
    }
    if (!keep.influencerProfile && duplicate.influencerProfile) {
      await tx.influencerProfile.update({ where: { userId: duplicate.id }, data: { userId: keep.id } });
    }
    if (!keep.instagramConnection && duplicate.instagramConnection) {
      await tx.instagramConnection.update({ where: { influencerId: duplicate.id }, data: { influencerId: keep.id } });
    }

    // Remove conflicting records where the target already has the equivalent relation.
    const duplicateStoreAssignments = await tx.storeInfluencerAssignment.findMany({ where: { influencerId: duplicate.id }, select: { id: true, organizationId: true } });
    for (const assignment of duplicateStoreAssignments) {
      const exists = await tx.storeInfluencerAssignment.findUnique({ where: { organizationId_influencerId: { organizationId: assignment.organizationId, influencerId: keep.id } } });
      if (exists) await tx.storeInfluencerAssignment.delete({ where: { id: assignment.id } });
    }
    const duplicateProductAssignments = await tx.productInfluencerAssignment.findMany({ where: { influencerId: duplicate.id }, select: { id: true, productId: true } });
    for (const assignment of duplicateProductAssignments) {
      const exists = await tx.productInfluencerAssignment.findUnique({ where: { productId_influencerId: { productId: assignment.productId, influencerId: keep.id } } });
      if (exists) await tx.productInfluencerAssignment.delete({ where: { id: assignment.id } });
    }
    const duplicateApplications = await tx.campaignApplication.findMany({ where: { influencerId: duplicate.id }, select: { id: true, campaignId: true } });
    for (const application of duplicateApplications) {
      const exists = await tx.campaignApplication.findUnique({ where: { campaignId_influencerId: { campaignId: application.campaignId, influencerId: keep.id } } });
      if (exists) await tx.campaignApplication.delete({ where: { id: application.id } });
    }
    const duplicateCampaignAssignments = await tx.campaignAssignment.findMany({ where: { influencerId: duplicate.id }, select: { id: true, campaignId: true } });
    for (const assignment of duplicateCampaignAssignments) {
      const exists = await tx.campaignAssignment.findUnique({ where: { campaignId_influencerId: { campaignId: assignment.campaignId, influencerId: keep.id } } });
      if (exists) await tx.campaignAssignment.delete({ where: { id: assignment.id } });
    }

    // Direct-message conversations also have a per-participant uniqueness constraint.
    const duplicateConversations = await tx.instagramDirectConversation.findMany({ where: { influencerId: duplicate.id }, select: { id: true, instagramParticipantId: true } });
    for (const conversation of duplicateConversations) {
      const existing = await tx.instagramDirectConversation.findUnique({ where: { influencerId_instagramParticipantId: { influencerId: keep.id, instagramParticipantId: conversation.instagramParticipantId } } });
      if (existing) {
        await tx.instagramDirectMessage.updateMany({ where: { conversationId: conversation.id }, data: { conversationId: existing.id } });
        await tx.instagramDirectConversation.delete({ where: { id: conversation.id } });
      }
    }

    await Promise.all([
      tx.storeInfluencerAssignment.updateMany({ where: { influencerId: duplicate.id }, data: { influencerId: keep.id } }),
      tx.productInfluencerAssignment.updateMany({ where: { influencerId: duplicate.id }, data: { influencerId: keep.id } }),
      tx.campaignApplication.updateMany({ where: { influencerId: duplicate.id }, data: { influencerId: keep.id } }),
      tx.campaignAssignment.updateMany({ where: { influencerId: duplicate.id }, data: { influencerId: keep.id } }),
      tx.affiliateLink.updateMany({ where: { creatorId: duplicate.id }, data: { creatorId: keep.id } }),
      tx.affiliateCommission.updateMany({ where: { creatorId: duplicate.id }, data: { creatorId: keep.id } }),
      tx.discountCode.updateMany({ where: { creatorId: duplicate.id }, data: { creatorId: keep.id } }),
      tx.notification.updateMany({ where: { userId: duplicate.id }, data: { userId: keep.id } }),
      tx.campaignPayout.updateMany({ where: { creatorId: duplicate.id }, data: { creatorId: keep.id } }),
      tx.barterSampleFulfillment.updateMany({ where: { creatorId: duplicate.id }, data: { creatorId: keep.id } }),
      tx.instagramAutomation.updateMany({ where: { influencerId: duplicate.id }, data: { influencerId: keep.id } }),
      tx.instagramCommentConversation.updateMany({ where: { influencerId: duplicate.id }, data: { influencerId: keep.id } }),
      tx.instagramManualReply.updateMany({ where: { senderUserId: duplicate.id }, data: { senderUserId: keep.id } }),
      tx.instagramDirectConversation.updateMany({ where: { influencerId: duplicate.id }, data: { influencerId: keep.id } }),
      tx.instagramDirectMessage.updateMany({ where: { senderUserId: duplicate.id }, data: { senderUserId: keep.id } }),
      tx.instagramOAuthState.updateMany({ where: { influencerId: duplicate.id }, data: { influencerId: keep.id } }),
      tx.instagramLoginTicket.updateMany({ where: { userId: duplicate.id }, data: { userId: keep.id } }),
      tx.authSession.updateMany({ where: { userId: duplicate.id }, data: { userId: keep.id } }),
    ]);

    await tx.user.delete({ where: { id: duplicate.id } });
    return { influencer: await getAdminInfluencer({ ...app, prisma: tx } as FastifyInstance, keep.id), deletedInfluencerId: duplicate.id };
  });
}

export async function getAdminInfluencerInstagramProfile(app: FastifyInstance, influencerId: string) {
  await getAdminInfluencer(app, influencerId);
  const connection = await app.prisma.instagramConnection.findUnique({
    where: { influencerId },
    select: { instagramUserId: true, username: true, displayName: true, status: true, tokenExpiresAt: true, createdAt: true, encryptedAccessToken: true },
  });
  if (!connection) return { connection: null, profile: null, unavailableReason: 'Instagram is not connected.' };
  const publicConnection = { instagramUserId: connection.instagramUserId, username: connection.username, displayName: connection.displayName, status: connection.status, connectedAt: connection.createdAt, tokenExpiresAt: connection.tokenExpiresAt };
  if (connection.status !== 'ACTIVE' || (connection.tokenExpiresAt && connection.tokenExpiresAt <= new Date())) {
    return { connection: publicConnection, profile: null, unavailableReason: 'The Instagram connection needs to be renewed.' };
  }
  try {
    return { connection: publicConnection, profile: await getInstagramProfile(decryptToken(connection.encryptedAccessToken)), unavailableReason: null };
  } catch {
    return { connection: publicConnection, profile: null, unavailableReason: 'Instagram statistics are temporarily unavailable.' };
  }
}
