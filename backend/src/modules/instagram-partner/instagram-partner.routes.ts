import { createHmac, timingSafeEqual } from 'node:crypto';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  connectPartnerAccount,
  deletePartnerRule,
  generatePartnerConnectUrl,
  getPartnerAccountStatus,
  getPartnerAnalytics,
  getPartnerConversationMessages,
  getPartnerLogs,
  getPartnerPosts,
  listPartnerConversations,
  listPartnerRules,
  processPartnerCommentWebhook,
  processPartnerDirectMessageWebhook,
  sendPartnerDirectMessage,
  sendPartnerDirectToRecipient,
  upsertPartnerRule,
} from './instagram-partner.service.js';
import { processInstagramCommentAutomations } from '../instagram-automations/instagram-comment-automation.service.js';
import { processInstagramDirectMessages } from '../instagram-direct-inbox/instagram-direct-inbox.service.js';

// -----------------------------------------------------------------------------
// Partner API Key Authentication Hook
// -----------------------------------------------------------------------------

function requirePartnerApiKey(request: FastifyRequest) {
  const apiKey = request.headers['x-api-key'];
  if (!apiKey || typeof apiKey !== 'string') {
    throw new AppError('UNAUTHORIZED', 'Missing x-api-key header.', 401);
  }

  const expectedKey = config.partnerApiKey;
  if (!expectedKey) {
    throw new AppError('PARTNER_API_NOT_CONFIGURED', 'Partner API key is not configured on the server.', 503);
  }

  // Constant-time comparison to prevent timing attacks
  const keyBuffer = Buffer.from(apiKey.trim());
  const expectedBuffer = Buffer.from(expectedKey.trim());

  if (keyBuffer.length !== expectedBuffer.length || !timingSafeEqual(keyBuffer, expectedBuffer)) {
    throw new AppError('UNAUTHORIZED', 'Invalid x-api-key header.', 401);
  }
}

// -----------------------------------------------------------------------------
// Meta Webhook Signature Verification Helper
// -----------------------------------------------------------------------------

export function verifyMetaWebhookSignature(rawBody: Buffer, signatureHeader?: string): boolean {
  if (!signatureHeader || !signatureHeader.toLowerCase().startsWith('sha256=')) {
    return false;
  }

  const candidateSecrets = [
    ...new Set([
      config.metaAppSecret,
      process.env.META_APP_SECRET,
      config.instagramAppSecret,
      process.env.INSTAGRAM_APP_SECRET,
      process.env.FACEBOOK_APP_SECRET,
    ]
      .map((s) => s?.trim())
      .filter((s): s is string => Boolean(s))),
  ];

  if (candidateSecrets.length === 0) {
    return false;
  }

  const signatureHex = signatureHeader.slice('sha256='.length).trim();
  if (!/^[a-f0-9]{64}$/i.test(signatureHex)) {
    return false;
  }

  const sigBuffer = Buffer.from(signatureHex, 'hex');

  return candidateSecrets.some((secret) => {
    const expectedHmac = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expBuffer = Buffer.from(expectedHmac, 'hex');
    return sigBuffer.length === expBuffer.length && timingSafeEqual(sigBuffer, expBuffer);
  });
}

// -----------------------------------------------------------------------------
// External Partner Routes Plugin (/api/v1/external/instagram/*)
// -----------------------------------------------------------------------------

export const externalInstagramRoutes: FastifyPluginAsync = async (app) => {
  // Pre-handler hook validating x-api-key on all /api/v1/external/instagram/* endpoints
  app.addHook('preHandler', async (request) => {
    requirePartnerApiKey(request);
  });

  // GET /api/v1/external/instagram/status?tenantId=...
  app.get('/external/instagram/status', async (request) => {
    const { tenantId } = request.query as { tenantId?: string };
    if (!tenantId?.trim()) {
      throw new AppError('TENANT_ID_REQUIRED', 'Query parameter tenantId is required.', 400);
    }
    return getPartnerAccountStatus(app, tenantId.trim());
  });

  // GET /api/v1/external/instagram/connect-url?tenantId=...&redirectUri=...
  app.get('/external/instagram/connect-url', async (request) => {
    const { tenantId, redirectUri, scope } = request.query as { tenantId?: string; redirectUri?: string; scope?: string };
    if (!tenantId?.trim() || !redirectUri?.trim()) {
      throw new AppError('PARAMETERS_REQUIRED', 'Both tenantId and redirectUri query parameters are required.', 400);
    }
    return generatePartnerConnectUrl(tenantId.trim(), redirectUri.trim(), scope?.trim());
  });

  // POST /api/v1/external/instagram/connect-account (Exchange code or direct token)
  app.post('/external/instagram/connect-account', async (request) => {
    const body = (request.body || {}) as any;
    return connectPartnerAccount(app, body);
  });

  // GET /api/v1/external/instagram/posts?tenantId=...&limit=20
  app.get('/external/instagram/posts', async (request) => {
    const { tenantId, limit } = request.query as { tenantId?: string; limit?: string };
    if (!tenantId?.trim()) {
      throw new AppError('TENANT_ID_REQUIRED', 'Query parameter tenantId is required.', 400);
    }
    const parsedLimit = limit ? Number(limit) : 20;
    return getPartnerPosts(app, tenantId.trim(), parsedLimit);
  });

  // GET /api/v1/external/instagram/rules?tenantId=...
  app.get('/external/instagram/rules', async (request) => {
    const { tenantId } = request.query as { tenantId?: string };
    if (!tenantId?.trim()) {
      throw new AppError('TENANT_ID_REQUIRED', 'Query parameter tenantId is required.', 400);
    }
    return listPartnerRules(app, tenantId.trim());
  });

  // POST /api/v1/external/instagram/rules
  app.post('/external/instagram/rules', async (request) => {
    const body = (request.body || {}) as any;
    return upsertPartnerRule(app, body);
  });

  // DELETE /api/v1/external/instagram/rules/:ruleId?tenantId=...
  app.delete('/external/instagram/rules/:ruleId', async (request) => {
    const { ruleId } = request.params as { ruleId: string };
    const { tenantId } = request.query as { tenantId?: string };
    if (!tenantId?.trim()) {
      throw new AppError('TENANT_ID_REQUIRED', 'Query parameter tenantId is required.', 400);
    }
    return deletePartnerRule(app, tenantId.trim(), ruleId);
  });

  // GET /api/v1/external/instagram/analytics?tenantId=...&days=30
  app.get('/external/instagram/analytics', async (request) => {
    const { tenantId, days } = request.query as { tenantId?: string; days?: string };
    if (!tenantId?.trim()) {
      throw new AppError('TENANT_ID_REQUIRED', 'Query parameter tenantId is required.', 400);
    }
    const parsedDays = days ? Number(days) : 30;
    return getPartnerAnalytics(app, tenantId.trim(), parsedDays);
  });

  // GET /api/v1/external/instagram/logs?tenantId=...&page=1&limit=25&ruleId=...
  app.get('/external/instagram/logs', async (request) => {
    const { tenantId, page, limit, ruleId } = request.query as {
      tenantId?: string;
      page?: string;
      limit?: string;
      ruleId?: string;
    };
    if (!tenantId?.trim()) {
      throw new AppError('TENANT_ID_REQUIRED', 'Query parameter tenantId is required.', 400);
    }
    return getPartnerLogs(app, tenantId.trim(), {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
      ruleId,
    });
  });

  // GET /api/v1/external/instagram/conversations?tenantId=...&page=1&limit=25&search=...
  app.get('/external/instagram/conversations', async (request) => {
    const { tenantId, page, limit, search } = request.query as {
      tenantId?: string;
      page?: string;
      limit?: string;
      search?: string;
    };
    if (!tenantId?.trim()) {
      throw new AppError('TENANT_ID_REQUIRED', 'Query parameter tenantId is required.', 400);
    }
    return listPartnerConversations(app, tenantId.trim(), {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
      search,
    });
  });

  // GET /api/v1/external/instagram/conversations/:conversationId/messages?tenantId=...
  app.get('/external/instagram/conversations/:conversationId/messages', async (request) => {
    const { conversationId } = request.params as { conversationId: string };
    const { tenantId, page, limit } = request.query as {
      tenantId?: string;
      page?: string;
      limit?: string;
    };
    if (!tenantId?.trim()) {
      throw new AppError('TENANT_ID_REQUIRED', 'Query parameter tenantId is required.', 400);
    }
    return getPartnerConversationMessages(app, tenantId.trim(), conversationId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  });

  // POST /api/v1/external/instagram/conversations/:conversationId/messages
  app.post('/external/instagram/conversations/:conversationId/messages', async (request) => {
    const { conversationId } = request.params as { conversationId: string };
    const body = (request.body || {}) as {
      tenantId?: string;
      messageText?: string;
      text?: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'video' | 'audio' | 'file';
      useHumanAgentTag?: boolean;
    };
    const tenantId = body.tenantId || (request.query as any)?.tenantId;
    if (!tenantId?.trim()) {
      throw new AppError('TENANT_ID_REQUIRED', 'tenantId is required.', 400);
    }

    return sendPartnerDirectMessage(app, {
      tenantId: tenantId.trim(),
      conversationId,
      messageText: body.messageText || body.text,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
      useHumanAgentTag: body.useHumanAgentTag,
    });
  });

  // POST /api/v1/external/instagram/messages/send
  app.post('/external/instagram/messages/send', async (request) => {
    const body = (request.body || {}) as {
      tenantId?: string;
      recipientId?: string;
      messageText?: string;
      text?: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'video' | 'audio' | 'file';
      useHumanAgentTag?: boolean;
    };
    if (!body.tenantId?.trim()) {
      throw new AppError('TENANT_ID_REQUIRED', 'tenantId is required in request body.', 400);
    }
    if (!body.recipientId?.trim()) {
      throw new AppError('RECIPIENT_REQUIRED', 'recipientId is required in request body.', 400);
    }

    return sendPartnerDirectToRecipient(app, {
      tenantId: body.tenantId.trim(),
      recipientId: body.recipientId.trim(),
      messageText: body.messageText || body.text,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
      useHumanAgentTag: body.useHumanAgentTag,
    });
  });

  // POST /api/v1/external/instagram/simulate/message (Testing & simulation)
  app.post('/external/instagram/simulate/message', async (request) => {
    const body = (request.body || {}) as {
      tenantId?: string;
      messageText?: string;
      senderUsername?: string;
      senderId?: string;
    };
    if (!body.tenantId?.trim()) {
      throw new AppError('TENANT_ID_REQUIRED', 'tenantId is required.', 400);
    }
    const account = await app.prisma.instagramAccount.findUnique({
      where: { tenantOrUserId: body.tenantId.trim() },
    });
    if (!account) {
      throw new AppError('ACCOUNT_NOT_FOUND', 'Instagram account not found for this tenant.', 404);
    }

    const senderId = body.senderId || `sim_user_${Date.now().toString().slice(-6)}`;
    const senderUsername = body.senderUsername || 'test_shopper';
    const text = body.messageText || 'Hi! What is the price of this product?';

    const simulatedPayload = {
      object: 'instagram',
      entry: [
        {
          id: account.instagramBusinessAccountId,
          time: Date.now(),
          messaging: [
            {
              sender: { id: senderId, username: senderUsername },
              recipient: { id: account.instagramBusinessAccountId },
              timestamp: Date.now(),
              message: {
                mid: `mid_sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                text,
              },
            },
          ],
        },
      ],
    };

    const count = await processPartnerDirectMessageWebhook(app, simulatedPayload);
    return {
      success: true,
      simulated: true,
      processed: count,
      senderId,
      senderUsername,
      text,
    };
  });

  // POST /api/v1/external/instagram/simulate/comment (Testing & simulation)
  app.post('/external/instagram/simulate/comment', async (request) => {
    const body = (request.body || {}) as {
      tenantId?: string;
      commentText?: string;
      commenterUsername?: string;
      mediaId?: string;
    };
    if (!body.tenantId?.trim()) {
      throw new AppError('TENANT_ID_REQUIRED', 'tenantId is required.', 400);
    }
    const account = await app.prisma.instagramAccount.findUnique({
      where: { tenantOrUserId: body.tenantId.trim() },
    });
    if (!account) {
      throw new AppError('ACCOUNT_NOT_FOUND', 'Instagram account not found for this tenant.', 404);
    }

    const commentId = `comm_sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const result = await processPartnerCommentWebhook(app, account.instagramBusinessAccountId, {
      id: commentId,
      text: body.commentText || 'price please link',
      from: {
        id: `user_sim_${Date.now().toString().slice(-6)}`,
        username: body.commenterUsername || 'shopper_eva',
      },
      media: {
        id: body.mediaId || 'media_sim_123',
      },
    });

    return {
      success: true,
      simulated: true,
      commentId,
      result,
    };
  });
};

// -----------------------------------------------------------------------------
// Meta Inbound Webhook Listener Routes (GET / POST /api/webhooks/instagram)
// -----------------------------------------------------------------------------

export const metaWebhookListenerRoutes: FastifyPluginAsync = async (app) => {
  const handleWebhookVerification = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | undefined>;
    const mode = query['hub.mode'];
    const verifyToken = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const expectedToken = config.metaInstagramVerifyToken || config.webhookVerifyToken;

    if (mode === 'subscribe' && verifyToken && expectedToken && verifyToken === expectedToken) {
      return reply.type('text/plain').status(200).send(challenge ?? '');
    }

    throw new AppError('WEBHOOK_VERIFICATION_FAILED', 'Meta webhook verification failed: tokens do not match.', 403);
  };

  const handleWebhookEvent = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!Buffer.isBuffer(request.body)) {
      throw new AppError('INVALID_WEBHOOK_PAYLOAD', 'Webhook body must be raw JSON buffer.', 400);
    }
    const rawBody = request.body as Buffer;
    const signature = request.headers['x-hub-signature-256'];

    if (!verifyMetaWebhookSignature(rawBody, typeof signature === 'string' ? signature : undefined)) {
      request.log.warn({ sig: signature }, 'Invalid Meta webhook HMAC signature received');
      throw new AppError('INVALID_WEBHOOK_SIGNATURE', 'Meta webhook signature is invalid.', 401);
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return reply.status(200).send({ success: true, received: true });
    }

    const entries = Array.isArray(payload?.entry) ? payload.entry : [];

    // Print full webhook payload clearly in server logs
    request.log.info(
      {
        webhookEvent: 'INCOMING_META_WEBHOOK',
        object: payload?.object,
        entryCount: entries.length,
        rawPayload: payload,
      },
      `📥 [META WEBHOOK RECEIVED] (${entries.length} entry/entries):\n${JSON.stringify(payload, null, 2)}`
    );

    const processEntries = async () => {
      for (const entry of entries) {
        const businessAccountId = entry.id;
        const changes = Array.isArray(entry.changes) ? entry.changes : [];

        for (const change of changes) {
          if (change.field === 'comments' && change.value) {
            try {
              await processPartnerCommentWebhook(app, businessAccountId, change.value);
            } catch (err: any) {
              request.log.error({ err: err?.message, businessAccountId }, 'Error processing partner comment webhook');
            }
          }
        }
      }

      // Process inbound direct messages and automations for both partner accounts and creators
      await Promise.all([
        processPartnerDirectMessageWebhook(app, payload).catch((err) =>
          request.log.error({ err: err?.message }, 'Partner direct message processing error')
        ),
        processInstagramCommentAutomations(app, payload).catch((err) =>
          request.log.warn({ err: err?.message }, 'Creator comment automation error')
        ),
        processInstagramDirectMessages(app, payload).catch((err) =>
          request.log.warn({ err: err?.message }, 'Creator DM processing error')
        ),
      ]);
    };

    if (config.nodeEnv === 'test') {
      await processEntries();
      return reply.status(200).send({ success: true, received: true });
    }

    // In production: Return 200 immediately to Meta (<50ms) to satisfy Meta's 5s SLA,
    // and process actions in the background.
    reply.status(200).send({ success: true, received: true });
    setImmediate(() => {
      processEntries().catch((err) => {
        request.log.error({ err: err?.message }, 'Unhandled error in background webhook processing');
      });
    });
    return reply;
  };

  // Both /api/webhooks/instagram and /webhooks/instagram paths supported
  app.get('/api/webhooks/instagram', handleWebhookVerification);
  app.post('/api/webhooks/instagram', handleWebhookEvent);
  app.get('/webhooks/instagram', handleWebhookVerification);
  app.post('/webhooks/instagram', handleWebhookEvent);
};

