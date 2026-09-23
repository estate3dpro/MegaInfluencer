import type { FastifyInstance } from 'fastify';

import { AppError, ForbiddenError } from '../../shared/errors/app-error.js';
import type { AuthenticatedActor } from '../../shared/auth/authorization.js';
import { decryptToken } from '../instagram/instagram.crypto.js';
import { sendInstagramPrivateReply } from '../instagram/instagram.client.js';

type InboxActor = AuthenticatedActor & { role: 'INFLUENCER' | 'STORE_OWNER' };

function providerErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 1_000) : 'Instagram rejected the private reply.';
}

async function getStoreOrganizationId(app: FastifyInstance, userId: string) {
  const organization = await app.prisma.organization.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (!organization) throw new AppError('STORE_NOT_FOUND', 'Store not found.', 404);
  return organization.id;
}

async function assertConversationAccess(app: FastifyInstance, actor: InboxActor, influencerId: string) {
  if (actor.role === 'INFLUENCER') {
    if (actor.userId !== influencerId) throw new ForbiddenError();
    return;
  }

  const organizationId = await getStoreOrganizationId(app, actor.userId);
  const assignment = await app.prisma.storeInfluencerAssignment.findUnique({
    where: { organizationId_influencerId: { organizationId, influencerId } },
    select: { id: true },
  });
  if (!assignment) throw new ForbiddenError();
}

const conversationSelect = {
  id: true,
  instagramCommentId: true,
  commenterId: true,
  commenterUsername: true,
  commentText: true,
  instagramMediaId: true,
  instagramAccountId: true,
  createdAt: true,
  updatedAt: true,
  influencer: { select: { id: true, displayName: true, instagramConnection: { select: { username: true, status: true } } } },
  manualReplies: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      message: true,
      status: true,
      providerMessageId: true,
      errorMessage: true,
      sentAt: true,
      createdAt: true,
      sender: { select: { id: true, displayName: true, role: true } },
    },
  },
};

export async function listInstagramInbox(app: FastifyInstance, actor: InboxActor) {
  let influencerIds: string[] | undefined;
  if (actor.role === 'STORE_OWNER') {
    const organizationId = await getStoreOrganizationId(app, actor.userId);
    const assignments = await app.prisma.storeInfluencerAssignment.findMany({
      where: { organizationId },
      select: { influencerId: true },
    });
    influencerIds = assignments.map((assignment) => assignment.influencerId);
  }

  const items = await app.prisma.instagramCommentConversation.findMany({
    where: actor.role === 'INFLUENCER' ? { influencerId: actor.userId } : { influencerId: { in: influencerIds } },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: conversationSelect,
  });
  return items;
}

export async function sendManualInstagramReply(
  app: FastifyInstance,
  actor: InboxActor,
  conversationId: string,
  message: string,
) {
  const conversation = await app.prisma.instagramCommentConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      influencerId: true,
      instagramCommentId: true,
      instagramAccountId: true,
      influencer: { select: { instagramConnection: true } },
    },
  });
  if (!conversation) throw new AppError('INSTAGRAM_CONVERSATION_NOT_FOUND', 'Comment conversation not found.', 404);
  await assertConversationAccess(app, actor, conversation.influencerId);

  const connection = conversation.influencer.instagramConnection;
  if (!connection || connection.status !== 'ACTIVE') {
    throw new AppError('INSTAGRAM_CONNECTION_INACTIVE', 'This creator’s Instagram connection is not active.', 409);
  }
  if (connection.tokenExpiresAt && connection.tokenExpiresAt <= new Date()) {
    throw new AppError('INSTAGRAM_CONNECTION_EXPIRED', 'This creator’s Instagram access token has expired.', 409);
  }

  // Instagram accepts only one initial private reply for a comment. An
  // automation may already have sent that first message; further messages
  // require the customer to reply in Instagram first, creating a normal DM
  // conversation. Do not send a second request that Meta reports only as an
  // unhelpful "unknown error".
  const automatedReply = await app.prisma.instagramAutomationDelivery.findFirst({
    where: {
      commentId: conversation.instagramCommentId,
      status: 'SENT',
      automation: { influencerId: conversation.influencerId },
    },
    select: { id: true },
  });
  if (automatedReply) {
    throw new AppError(
      'INSTAGRAM_PRIVATE_REPLY_ALREADY_SENT',
      'An automated private reply was already sent for this comment. The customer must reply in Instagram before another direct message can be sent.',
      409,
    );
  }
  if (!conversation.instagramAccountId) {
    throw new AppError(
      'INSTAGRAM_WEBHOOK_ACCOUNT_UNKNOWN',
      'This older comment does not include the webhook Instagram account ID needed to send a private reply. Please use a newly received comment instead.',
      409,
    );
  }

  const reply = await app.prisma.instagramManualReply.create({
    data: { conversationId, senderUserId: actor.userId, senderRole: actor.role, message },
    select: { id: true },
  });

  try {
    // The webhook account ID is authoritative for Instagram Login webhooks.
    const result = await sendInstagramPrivateReply(
      decryptToken(connection.encryptedAccessToken),
      conversation.instagramAccountId,
      conversation.instagramCommentId,
      message,
    );
    const sentAt = new Date();
    const updated = await app.prisma.instagramManualReply.update({
      where: { id: reply.id },
      data: { status: 'SENT', providerMessageId: result.message_id ?? null, sentAt },
      select: { id: true, message: true, status: true, providerMessageId: true, errorMessage: true, sentAt: true, createdAt: true },
    });
    await app.prisma.instagramCommentConversation.update({ where: { id: conversationId }, data: { updatedAt: sentAt } });
    return updated;
  } catch (error) {
    await app.prisma.instagramManualReply.update({
      where: { id: reply.id },
      data: { status: 'FAILED', errorMessage: providerErrorMessage(error) },
    });
    throw error;
  }
}
