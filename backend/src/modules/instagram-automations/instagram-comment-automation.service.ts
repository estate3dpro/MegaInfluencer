import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';

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

  // First load every rule for the post. A paused rule still identifies the
  // creator who owns a comment, so their comment remains available in the
  // manual inbox even if it does not trigger an automated DM.
  const postAutomations = await app.prisma.instagramAutomation.findMany({
    where: { instagramPostId: event.mediaId },
    include: { influencer: { include: { instagramConnection: true } } },
  });

  const directConnection = event.instagramAccountId
    ? await app.prisma.instagramConnection.findUnique({
        where: { instagramUserId: event.instagramAccountId },
        select: { influencerId: true },
      })
    : null;
  const inboxInfluencerId = directConnection?.influencerId ?? postAutomations[0]?.influencerId;
  if (inboxInfluencerId) {
    await app.prisma.instagramCommentConversation.upsert({
      where: { instagramCommentId: event.commentId },
      create: {
        influencerId: inboxInfluencerId,
        instagramCommentId: event.commentId,
        commenterId: event.commenterId,
        commenterUsername: event.commenterName,
        commentText: event.commentText,
        instagramMediaId: event.mediaId,
        instagramAccountId: event.instagramAccountId,
      },
      update: {
        commenterUsername: event.commenterName,
        commentText: event.commentText,
        instagramAccountId: event.instagramAccountId,
      },
    });
    app.log.info({ ...commentLog(event), inboxInfluencerId }, 'Instagram comment saved to manual inbox');
  } else {
    app.log.warn(commentLog(event), 'Instagram comment could not be assigned to an inbox');
  }

  const automations = postAutomations.filter((automation) => automation.status === 'ACTIVE');

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
      app.log.warn({
        ...logContext,
        connectedInstagramAccountId: connection.instagramUserId,
        webhookInstagramAccountId: event.instagramAccountId,
        accountIdMatches,
        // Meta signs this event and the automation lookup already matches its
        // globally unique media ID. Instagram Login can return an OAuth ID
        // different from the account ID used in a webhook entry, so use the
        // webhook ID for the reply endpoint (the same behavior as the working
        // Next.js implementation) instead of discarding a valid event.
        replyInstagramAccountId: event.instagramAccountId,
      }, 'Instagram automation account IDs differ; using webhook account ID for private reply');
    }
    if (!(automation as any).replyToAnyComment && !matchesKeywords(event.commentText, automation.keywords, automation.wholeWordMatch)) {
      summary.skipped += 1;
      app.log.info({ ...logContext, keywords: automation.keywords, wholeWordMatch: automation.wholeWordMatch }, 'Instagram automation skipped: comment did not match keywords');
      continue;
    }
    summary.matchingAutomations += 1;
    app.log.info({
      ...logContext,
      keywords: automation.keywords,
      replyOnDuplicateCommentWebhook: automation.replyOnDuplicateCommentWebhook,
    }, 'Instagram automation keyword matched');

    // By default, a unique attempt key is the idempotency boundary for Meta
    // retries. A rule can explicitly opt in to replying again to a redelivery
    // of the exact same comment; those attempts retain the same comment ID but
    // get a distinct audit key.
    let delivery: { id: string };
    try {
      delivery = await app.prisma.instagramAutomationDelivery.create({
        data: {
          automationId: automation.id,
          commentId: event.commentId,
          attemptKey: automation.replyOnDuplicateCommentWebhook
            ? `${event.commentId}:${randomUUID()}`
            : event.commentId,
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
      const replyInstagramAccountId = event.instagramAccountId ?? connection.instagramUserId;
      const result = await sendInstagramPrivateReply(
        decryptToken(connection.encryptedAccessToken),
        replyInstagramAccountId,
        event.commentId,
        personaliseMessage(automation.dmMessage, event.commenterName),
      );
      await app.prisma.instagramAutomationDelivery.update({
        where: { id: delivery.id },
        data: { status: 'SENT', providerMessageId: result.message_id ?? null, sentAt: new Date() },
      });
      summary.sent += 1;
      app.log.info({
        ...logContext,
        replyInstagramAccountId,
        providerMessageId: result.message_id ?? null,
      }, 'Instagram automation private reply sent');
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
