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

type ProcessingSummary = {
  comments: number;
  matchingAutomations: number;
  sent: number;
  failed: number;
  skipped: number;
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

function commentLog(event: MetaCommentEvent) {
  return {
    commentId: event.commentId,
    commenterId: event.commenterId,
    commenterUsername: event.commenterName ?? null,
    mediaId: event.mediaId,
    instagramAccountId: event.instagramAccountId ?? null,
    // Keep logs useful without allowing an unusually long comment to flood them.
    commentText: event.commentText.slice(0, 500),
  };
}

async function processCommentEvent(app: FastifyInstance, event: MetaCommentEvent): Promise<Omit<ProcessingSummary, 'comments'>> {
  const summary = { matchingAutomations: 0, sent: 0, failed: 0, skipped: 0 };
  app.log.info(commentLog(event), 'Instagram comment received');

  const automations = await app.prisma.instagramAutomation.findMany({
    where: { instagramPostId: event.mediaId, status: 'ACTIVE' },
    include: { influencer: { include: { instagramConnection: true } } },
  });

  if (!automations.length) {
    app.log.info(commentLog(event), 'No active Instagram automation exists for this post');
    return summary;
  }

  for (const automation of automations) {
    const connection = automation.influencer.instagramConnection;
    const logContext = { ...commentLog(event), automationId: automation.id, automationName: automation.name };
    if (!connection) {
      summary.skipped += 1;
      app.log.warn(logContext, 'Instagram automation skipped: creator has no Instagram connection');
      continue;
    }
    if (connection.status !== 'ACTIVE') {
      summary.skipped += 1;
      app.log.warn({ ...logContext, connectionStatus: connection.status }, 'Instagram automation skipped: connection is inactive');
      continue;
    }
    if (connection.tokenExpiresAt && connection.tokenExpiresAt <= new Date()) {
      summary.skipped += 1;
      app.log.warn({ ...logContext, tokenExpiresAt: connection.tokenExpiresAt }, 'Instagram automation skipped: connection token expired');
      continue;
    }
    const accountIdMatches = !event.instagramAccountId || connection.instagramUserId === event.instagramAccountId;
    app.log.info({
      ...logContext,
      connectedInstagramAccountId: connection.instagramUserId,
      webhookInstagramAccountId: event.instagramAccountId ?? null,
      accountIdMatches,
    }, 'Instagram automation ownership check completed');
    if (!accountIdMatches) {
      summary.skipped += 1;
      app.log.warn({
        ...logContext,
        connectedInstagramAccountId: connection.instagramUserId,
        webhookInstagramAccountId: event.instagramAccountId,
        accountIdMatches,
      }, 'Instagram automation skipped: webhook account does not own this automation');
      continue;
    }
    if (!matchesKeywords(event.commentText, automation.keywords, automation.wholeWordMatch)) {
      summary.skipped += 1;
      app.log.info({ ...logContext, keywords: automation.keywords, wholeWordMatch: automation.wholeWordMatch }, 'Instagram automation skipped: comment did not match keywords');
      continue;
    }
    summary.matchingAutomations += 1;
    app.log.info({ ...logContext, keywords: automation.keywords }, 'Instagram automation keyword matched');

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
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        summary.skipped += 1;
        app.log.info(logContext, 'Instagram automation skipped: duplicate comment delivery');
        continue;
      }
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
      summary.sent += 1;
      app.log.info({ ...logContext, providerMessageId: result.message_id ?? null }, 'Instagram automation private reply sent');
    } catch (error) {
      await app.prisma.instagramAutomationDelivery.update({
        where: { id: delivery.id },
        data: { status: 'FAILED', errorMessage: errorMessage(error) },
      });
      summary.failed += 1;
      app.log.error({ err: error, ...logContext }, 'Instagram automation private reply failed');
    }
  }
  return summary;
}

export async function processInstagramCommentAutomations(app: FastifyInstance, payload: unknown) {
  const events = parseCommentEvents(payload);
  const summary: ProcessingSummary = { comments: events.length, matchingAutomations: 0, sent: 0, failed: 0, skipped: 0 };
  for (const event of events) {
    const result = await processCommentEvent(app, event);
    summary.matchingAutomations += result.matchingAutomations;
    summary.sent += result.sent;
    summary.failed += result.failed;
    summary.skipped += result.skipped;
  }
  return summary;
}
