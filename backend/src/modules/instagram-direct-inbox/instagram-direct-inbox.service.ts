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
  let saved = 0;
  for (const entry of entries) {
    const accountId = typeof entry?.id === 'string' ? entry.id : undefined;
    const events = [...(Array.isArray(entry?.messaging) ? entry.messaging : []), ...(Array.isArray(entry?.changes) ? entry.changes.filter((change: any) => change?.field === 'messages').map((change: any) => change.value) : [])];
    if (!accountId) continue;
    const connection = await app.prisma.instagramConnection.findUnique({ where: { instagramUserId: accountId }, select: { influencerId: true } });
    if (!connection) { app.log.warn({ instagramAccountId: accountId }, 'Instagram direct message skipped: account is not connected'); continue; }
    for (const event of events) {
      const message = event?.message ?? event;
      const text = typeof message?.text === 'string' ? message.text.trim() : '';
      const messageId = typeof message?.mid === 'string' ? message.mid : typeof message?.id === 'string' ? message.id : undefined;
      const senderId = typeof event?.sender?.id === 'string' ? event.sender.id : typeof event?.from?.id === 'string' ? event.from.id : undefined;
      if (!text || !senderId || senderId === accountId) continue;
      const timestamp = Number(event?.timestamp ?? message?.timestamp);
      const sentAt = Number.isFinite(timestamp) ? new Date(timestamp > 10_000_000_000 ? timestamp : timestamp * 1000) : new Date();
      const conversation = await app.prisma.instagramDirectConversation.upsert({
        where: { influencerId_instagramParticipantId: { influencerId: connection.influencerId, instagramParticipantId: senderId } },
        create: { influencerId: connection.influencerId, instagramParticipantId: senderId, participantUsername: event?.sender?.username ?? event?.from?.username ?? null, instagramAccountId: accountId, lastMessageAt: sentAt },
        update: { participantUsername: event?.sender?.username ?? event?.from?.username ?? undefined, instagramAccountId: accountId, lastMessageAt: sentAt },
        select: { id: true },
      });
      try {
        await app.prisma.instagramDirectMessage.create({ data: { conversationId: conversation.id, instagramMessageId: messageId, direction: 'INBOUND', messageText: text, sentAt } });
        saved += 1;
      } catch (error) { if (!(typeof error === 'object' && error && 'code' in error && error.code === 'P2002')) throw error; }
    }
  }
  return saved;
}

export async function listInstagramDirectConversations(app: FastifyInstance, actor: DirectActor) {
  const ids = actor.role === 'STORE_OWNER' ? (await app.prisma.storeInfluencerAssignment.findMany({ where: { organizationId: await organizationId(app, actor.userId) }, select: { influencerId: true } })).map((row) => row.influencerId) : undefined;
  return app.prisma.instagramDirectConversation.findMany({
    where: actor.role === 'INFLUENCER' ? { influencerId: actor.userId } : { influencerId: { in: ids } },
    orderBy: { lastMessageAt: 'desc' }, take: 100,
    include: { influencer: { select: { id: true, displayName: true, instagramConnection: { select: { username: true } } } }, messages: { orderBy: { sentAt: 'asc' }, select: { id: true, direction: true, messageText: true, sentAt: true, sender: { select: { displayName: true } } } } },
  });
}

export async function sendDirectInboxMessage(app: FastifyInstance, actor: DirectActor, conversationId: string, message: string) {
  const conversation = await app.prisma.instagramDirectConversation.findUnique({ where: { id: conversationId }, include: { influencer: { include: { instagramConnection: true } } } });
  if (!conversation) throw new AppError('INSTAGRAM_DM_CONVERSATION_NOT_FOUND', 'Instagram conversation not found.', 404);
  await assertAccess(app, actor, conversation.influencerId);
  const connection = conversation.influencer.instagramConnection;
  if (!connection || connection.status !== 'ACTIVE') throw new AppError('INSTAGRAM_CONNECTION_INACTIVE', 'This creator’s Instagram connection is not active.', 409);
  const result = await sendInstagramDirectMessage(decryptToken(connection.encryptedAccessToken), conversation.instagramAccountId, conversation.instagramParticipantId, message);
  const sentAt = new Date();
  const saved = await app.prisma.instagramDirectMessage.create({ data: { conversationId, instagramMessageId: result.message_id ?? null, senderUserId: actor.userId, direction: 'OUTBOUND', messageText: message, sentAt }, select: { id: true, direction: true, messageText: true, sentAt: true } });
  await app.prisma.instagramDirectConversation.update({ where: { id: conversationId }, data: { lastMessageAt: sentAt } });
  return saved;
}
