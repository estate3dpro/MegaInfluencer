import type { FastifyPluginAsync } from 'fastify';

import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { parseOrThrow } from '../../shared/validation/pagination.js';
import { beginInstagramOAuth, completeInstagramOAuth, disconnectInstagram, exchangeInstagramLoginTicket, getConnection, getInstagramProfile, listInstagramMedia, recordWebhookDelivery, verifyWebhookSignature } from './instagram.service.js';
import { exchangeLoginTicketSchema, mediaQuerySchema, oauthCallbackQuerySchema, webhookVerificationSchema } from './instagram.schema.js';
import { config } from '../../config/env.js';

export const instagramAuthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/auth/instagram', async (_request, reply) => reply.redirect(await beginInstagramOAuth(app, 'LOGIN')));

  app.get('/auth/instagram/callback', async (request, reply) => {
    const query = parseOrThrow(oauthCallbackQuerySchema, request.query);
    if (query.error) return reply.redirect(`${config.frontendOrigin}/login?error=instagram_oauth_denied`);
    if (!query.code || !query.state) return reply.redirect(`${config.frontendOrigin}/login?error=instagram_oauth_invalid`);
    try {
      const { redirectUrl } = await completeInstagramOAuth(app, { code: query.code, state: query.state });
      return reply.redirect(redirectUrl);
    } catch (error) {
      app.log.warn({ err: error, requestId: request.id }, 'Instagram OAuth callback failed');
      return reply.redirect(`${config.frontendOrigin}/login?error=instagram_oauth_failed`);
    }
  });

  app.post('/auth/instagram/exchange', async (request) => {
    const { code } = parseOrThrow(exchangeLoginTicketSchema, request.body);
    return exchangeInstagramLoginTicket(app, code);
  });
};

export const influencerInstagramRoutes: FastifyPluginAsync = async (app) => {
  app.get('/influencer/instagram/connect', async (request, reply) => {
    const actor = requireRole(request, ['INFLUENCER']);
    return reply.redirect(await beginInstagramOAuth(app, 'CONNECT', actor.userId));
  });

  app.get('/influencer/instagram/connection', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    return { connection: await getConnection(app, actor.userId) };
  });

  app.delete('/influencer/instagram/connection', async (request, reply) => {
    const actor = requireRole(request, ['INFLUENCER']);
    await disconnectInstagram(app, actor.userId);
    return reply.status(204).send();
  });

  app.get('/influencer/instagram/posts', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const { limit } = parseOrThrow(mediaQuerySchema, request.query);
    return { items: await listInstagramMedia(app, actor.userId, limit) };
  });

  app.get('/influencer/instagram/profile', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    return getInstagramProfile(app, actor.userId);
  });
};

export const instagramWebhookRoutes: FastifyPluginAsync = async (app) => {
  app.get('/webhooks/instagram', async (request, reply) => {
    const query = parseOrThrow(webhookVerificationSchema, request.query);
    if (query['hub.mode'] !== 'subscribe' || !config.webhookVerifyToken || query['hub.verify_token'] !== config.webhookVerifyToken) {
      throw new AppError('WEBHOOK_VERIFICATION_FAILED', 'Webhook verification failed.', 403);
    }
    return reply.type('text/plain').send(query['hub.challenge'] ?? '');
  });

  app.post('/webhooks/instagram', async (request, reply) => {
    if (!Buffer.isBuffer(request.body)) throw new AppError('INVALID_WEBHOOK_PAYLOAD', 'Webhook body must be raw JSON.', 400);
    const rawBody = request.body;
    const signature = request.headers['x-hub-signature-256'];
    if (!verifyWebhookSignature(rawBody, typeof signature === 'string' ? signature : undefined)) {
      throw new AppError('INVALID_WEBHOOK_SIGNATURE', 'Webhook signature is invalid.', 401);
    }
    let payload: unknown;
    try { payload = JSON.parse(rawBody.toString('utf8')); } catch { throw new AppError('INVALID_WEBHOOK_PAYLOAD', 'Webhook body is not valid JSON.', 400); }
    const { duplicate } = await recordWebhookDelivery(app, rawBody, payload);
    return reply.status(200).send({ received: true, duplicate });
  });
};
