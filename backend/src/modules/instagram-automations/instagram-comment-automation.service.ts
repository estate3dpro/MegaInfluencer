import type { FastifyInstance } from 'fastify';

import { decryptToken } from '../instagram/instagram.crypto.js';
import { sendInstagramPrivateReply } from '../instagram/instagram.client.js';

type MetaCommentEvent = {
  commentId: string;
  commentText: string;
  commenterId: string;
  commenterName?: string;
  mediaId: string;
  instagramAccountId?: string;
};

type InstagramWebhookPayload = {
  object?: unknown;
  entry?: Array<{
    id?: unknown;
    changes?: Array<{
      field?: unknown;
      value?: {
        id?: unknown;
        text?: unknown;
        from?: { id?: unknown; username?: unknown };
        media?: { id?: unknown };
      };
    }>;
  }>;
};

function parseCommentEvents(payload: unknown): MetaCommentEvent[] {
  if (!payload || typeof payload !== 'object') return [];
  const webhook = payload as InstagramWebhookPayload;
  if (webhook.object !== 'instagram' || !Array.isArray(webhook.entry)) return [];

  const events: MetaCommentEvent[] = [];
  for (const entry of webhook.entry) {
    if (!Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      const value = change.field === 'comments' ? change.value : undefined;
      if (
        !value || typeof value.id !== 'string' || typeof value.text !== 'string'
        || typeof value.from?.id !== 'string' || typeof value.media?.id !== 'string'
      ) continue;
      events.push({
        commentId: value.id,
        commentText: value.text,
        commenterId: value.from.id,
        commenterName: typeof value.from.username === 'string' ? value.from.username : undefined,
        mediaId: value.media.id,
        instagramAccountId: typeof entry.id === 'string' ? entry.id : undefined,
      });
    }
  }
  return events;
}

function normaliseText(value: string) {
  return value
    .replace(/[^\p{L}\p{N}_\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function matchesKeywords(commentText: string, keywords: string[], wholeWordMatch: boolean) {
  const text = normaliseText(commentText);
  if (!text) return false;

  return keywords.some((keyword) => {
    const candidate = normaliseText(keyword);
    if (!candidate) return false;
    return wholeWordMatch
      ? new RegExp(`(^|\\s)${candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|\\s)`, 'iu').test(text)
      : text.includes(candidate);
  });
}

function personaliseMessage(message: string, username?: string) {
  return message.replace(/\{\{?\s*username\s*\}?\}/gi, username?.trim() || 'there');
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 1_000) : 'Unknown Instagram delivery error.';
}

async function processCommentEvent(app: FastifyInstance, event: MetaCommentEvent) {
  const automations = await app.prisma.instagramAutomation.findMany({
    where: { instagramPostId: event.mediaId, status: 'ACTIVE' },
    include: { influencer: { include: { instagramConnection: true } } },
  });

  for (const automation of automations) {
    const connection = automation.influencer.instagramConnection;
    if (
      !connection || connection.status !== 'ACTIVE'
      || (connection.tokenExpiresAt && connection.tokenExpiresAt <= new Date())
      || (event.instagramAccountId && connection.instagramUserId !== event.instagramAccountId)
      || !matchesKeywords(event.commentText, automation.keywords, automation.wholeWordMatch)
    ) continue;

    // This unique row is the idempotency boundary for Meta retries and events
    // delivered more than once in separate webhook payloads.
    let delivery: { id: string };
    try {
      delivery = await app.prisma.instagramAutomationDelivery.create({
        data: {
          automationId: automation.id,
          commentId: event.commentId,
          commenterId: event.commenterId,
          commenterName: event.commenterName,
          commentText: event.commentText,
        },
        select: { id: true },
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') continue;
      throw error;
    }

    try {
      const result = await sendInstagramPrivateReply(
        decryptToken(connection.encryptedAccessToken),
        connection.instagramUserId,
        event.commentId,
        personaliseMessage(automation.dmMessage, event.commenterName),
      );
      await app.prisma.instagramAutomationDelivery.update({
        where: { id: delivery.id },
        data: { status: 'SENT', providerMessageId: result.message_id ?? null, sentAt: new Date() },
      });
      app.log.info({ automationId: automation.id, commentId: event.commentId }, 'Instagram automation private reply sent');
    } catch (error) {
      await app.prisma.instagramAutomationDelivery.update({
        where: { id: delivery.id },
        data: { status: 'FAILED', errorMessage: errorMessage(error) },
      });
      app.log.error({ err: error, automationId: automation.id, commentId: event.commentId }, 'Instagram automation private reply failed');
    }
  }
}

export async function processInstagramCommentAutomations(app: FastifyInstance, payload: unknown) {
  const events = parseCommentEvents(payload);
  for (const event of events) await processCommentEvent(app, event);
  return events.length;
}
