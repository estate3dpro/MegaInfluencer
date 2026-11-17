import type { FastifyInstance } from 'fastify';
import { AppError, ForbiddenError } from '../../shared/errors/app-error.js';
import type { AuthenticatedActor } from '../../shared/auth/authorization.js';
import { decryptToken } from '../instagram/instagram.crypto.js';
import { sendInstagramDirectMessage } from '../instagram/instagram.client.js';

type DirectActor = AuthenticatedActor & { role: 'INFLUENCER' | 'STORE_OWNER' };

async function organizationId(app: FastifyInstance, userId: string) {
  const organization = await app.prisma.organization.findFirst({ where: { ownerId: userId }, select: { id: true } });
  if (!organization) throw new AppError('STORE_NOT_FOUND', 'Store not found.', 404);
  return organization.id;
}

async function assertAccess(app: FastifyInstance, actor: DirectActor, influencerId: string) {
  if (actor.role === 'INFLUENCER') { if (actor.userId !== influencerId) throw new ForbiddenError(); return; }
  const id = await organizationId(app, actor.userId);
  const assignment = await app.prisma.storeInfluencerAssignment.findUnique({ where: { organizationId_influencerId: { organizationId: id, influencerId } }, select: { id: true } });
  if (!assignment) throw new ForbiddenError();
}

export async function processInstagramDirectMessages(app: FastifyInstance, payload: unknown) {
  if (!payload || typeof payload !== 'object' || (payload as any).object !== 'instagram') return 0;
  const entries = Array.isArray((payload as any).entry) ? (payload as any).entry : [];

  app.log.info(
    { totalEntries: entries.length, rawPayload: payload },
    `📩 [CREATOR DIRECT INBOX] Ingesting DM webhook: ${entries.length} entry/entries received`
  );

  let saved = 0;
  for (const entry of entries) {
    const accountId = typeof entry?.id === 'string' ? entry.id : undefined;
    const events = [
      ...(Array.isArray(entry?.messaging) ? entry.messaging : []),
      ...(Array.isArray(entry?.changes)
        ? entry.changes.filter((change: any) => change?.field === 'messages').map((change: any) => change.value)
        : []),
    ];

    app.log.info(
      { accountId, eventCount: events.length, entrySnippet: entry },
      `📩 [CREATOR DIRECT INBOX] Checking account ${accountId} with ${events.length} message event(s)`
    );

    if (!accountId) continue;
    let influencerId: string | null = null;
    let tenantId: string | null = null;

    const connection = await app.prisma.instagramConnection.findUnique({
      where: { instagramUserId: accountId },
      select: { influencerId: true },
    });

    if (connection) {
      influencerId = connection.influencerId;
      tenantId = connection.influencerId;
    } else {
      const partnerAccount = await app.prisma.instagramAccount.findFirst({
        where: {
          OR: [
            { instagramBusinessAccountId: accountId },
            { tenantOrUserId: accountId },
          ],
          isActive: true,
        },
      });
      if (partnerAccount) {
        tenantId = partnerAccount.tenantOrUserId;
        const userRec = await app.prisma.user.findUnique({
          where: { id: partnerAccount.tenantOrUserId },
          select: { id: true },
        });
        if (userRec) {
          influencerId = userRec.id;
        }
      }
    }

    if (!influencerId && !tenantId) {
      app.log.warn(
        { instagramAccountId: accountId, eventsCount: events.length },
        `⚠️ [DIRECT INBOX] Account ${accountId} not found in either InstagramConnection or InstagramAccount; skipping.`
      );
      continue;
    }

    for (const event of events) {
      const message = event?.message ?? event;
      const text = typeof message?.text === 'string' ? message.text.trim() : '';
      const messageId = typeof message?.mid === 'string' ? message.mid : typeof message?.id === 'string' ? message.id : undefined;
      const senderId = typeof event?.sender?.id === 'string' ? event.sender.id : typeof event?.from?.id === 'string' ? event.from.id : undefined;

      app.log.info(
        { senderId, messageId, text, accountId, matchedInfluencer: influencerId, matchedTenant: tenantId },
        `📩 [DIRECT INBOX] Received message from ${senderId}: "${text}"`
      );

      if (!text || !senderId || senderId === accountId) continue;
      const timestamp = Number(event?.timestamp ?? message?.timestamp);
      const sentAt = Number.isFinite(timestamp) ? new Date(timestamp > 10_000_000_000 ? timestamp : timestamp * 1000) : new Date();
      const windowExpiresAt = new Date(sentAt.getTime() + 24 * 60 * 60 * 1000);

      let conversation = await app.prisma.instagramDirectConversation.findFirst({
        where: {
          instagramParticipantId: senderId,
          OR: [
            ...(influencerId ? [{ influencerId }] : []),
            ...(tenantId ? [{ tenantId }] : []),
            { instagramAccountId: accountId },
          ],
        },
      });

      if (!conversation) {
        conversation = await app.prisma.instagramDirectConversation.create({
          data: {
            influencerId,
            tenantId,
            instagramParticipantId: senderId,
            participantUsername: event?.sender?.username ?? event?.from?.username ?? null,
            instagramAccountId: accountId,
            lastMessageAt: sentAt,
            windowExpiresAt,
          },
        });
      } else {
        await app.prisma.instagramDirectConversation.update({
          where: { id: conversation.id },
          data: {
            influencerId: conversation.influencerId || influencerId,
            tenantId: conversation.tenantId || tenantId,
            participantUsername: event?.sender?.username ?? event?.from?.username ?? conversation.participantUsername,
            instagramAccountId: accountId,
            lastMessageAt: sentAt,
            windowExpiresAt,
          },
        });
      }

      try {
        await app.prisma.instagramDirectMessage.create({
          data: {
            conversationId: conversation.id,
            instagramMessageId: messageId,
            direction: 'INBOUND',
            messageText: text,
            sentAt,
          },
        });
        saved += 1;
      } catch (error) {
        if (!(typeof error === 'object' && error && 'code' in error && error.code === 'P2002')) throw error;
      }
    }
  }
  return saved;
}

export async function listInstagramDirectConversations(app: FastifyInstance, actor: DirectActor) {
  const ids =
    actor.role === 'STORE_OWNER'
      ? (
          await app.prisma.storeInfluencerAssignment.findMany({
            where: { organizationId: await organizationId(app, actor.userId) },
            select: { influencerId: true },
          })
        ).map((row) => row.influencerId)
      : undefined;

  return app.prisma.instagramDirectConversation.findMany({
    where:
      actor.role === 'INFLUENCER'
        ? {
            OR: [{ influencerId: actor.userId }, { tenantId: actor.userId }],
          }
        : {
            OR: [{ influencerId: { in: ids } }, { tenantId: { in: ids } }],
          },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    include: {
      influencer: { select: { id: true, displayName: true, instagramConnection: { select: { username: true } } } },
      messages: {
        orderBy: { sentAt: 'asc' },
        select: { id: true, direction: true, messageText: true, sentAt: true, sender: { select: { displayName: true } } },
      },
    },
  });
}

export async function sendDirectInboxMessage(app: FastifyInstance, actor: DirectActor, conversationId: string, message: string) {
  const conversation = await app.prisma.instagramDirectConversation.findUnique({
    where: { id: conversationId },
    include: { influencer: { include: { instagramConnection: true } } },
  });
  if (!conversation) {
    throw new AppError('INSTAGRAM_DM_CONVERSATION_NOT_FOUND', 'Instagram conversation not found.', 404);
  }

  if (actor.role === 'INFLUENCER') {
    if (conversation.influencerId !== actor.userId && conversation.tenantId !== actor.userId) {
      throw new ForbiddenError();
    }
  } else {
    await assertAccess(app, actor, conversation.influencerId || conversation.tenantId || '');
  }

  let pageToken: string | undefined;
  if (conversation.influencer?.instagramConnection?.status === 'ACTIVE') {
    pageToken = decryptToken(conversation.influencer.instagramConnection.encryptedAccessToken);
  } else {
    const partnerAcc = await app.prisma.instagramAccount.findFirst({
      where: {
        OR: [
          { tenantOrUserId: conversation.tenantId || conversation.influencerId || '' },
          { instagramBusinessAccountId: conversation.instagramAccountId },
        ],
        isActive: true,
      },
    });
    if (partnerAcc) {
      pageToken = decryptToken(partnerAcc.accessToken);
    }
  }

  if (!pageToken) {
    throw new AppError('INSTAGRAM_CONNECTION_INACTIVE', 'This creator’s Instagram connection is not active.', 409);
  }

  const result = await sendInstagramDirectMessage(
    pageToken,
    conversation.instagramAccountId,
    conversation.instagramParticipantId,
    message
  );
  const sentAt = new Date();
  const saved = await app.prisma.instagramDirectMessage.create({
    data: {
      conversationId,
      instagramMessageId: result.message_id ?? null,
      senderUserId: actor.userId,
      direction: 'OUTBOUND',
      messageText: message,
      sentAt,
    },
    select: { id: true, direction: true, messageText: true, sentAt: true },
  });
  await app.prisma.instagramDirectConversation.update({ where: { id: conversationId }, data: { lastMessageAt: sentAt } });
  return saved;
}
