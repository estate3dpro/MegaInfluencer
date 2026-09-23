import type { FastifyPluginAsync } from 'fastify';

import { requireRole } from '../../shared/auth/authorization.js';
import { parseOrThrow } from '../../shared/validation/pagination.js';
import { conversationParamsSchema, sendManualReplySchema } from './instagram-inbox.schema.js';
import { listInstagramInbox, sendManualInstagramReply } from './instagram-inbox.service.js';

export const instagramInboxRoutes: FastifyPluginAsync = async (app) => {
  app.get('/instagram-inbox', async (request) => {
    const actor = requireRole(request, ['INFLUENCER', 'STORE_OWNER']);
    return { items: await listInstagramInbox(app, actor as typeof actor & { role: 'INFLUENCER' | 'STORE_OWNER' }) };
  });

  app.post('/instagram-inbox/:conversationId/replies', async (request, reply) => {
    const actor = requireRole(request, ['INFLUENCER', 'STORE_OWNER']);
    const { conversationId } = parseOrThrow(conversationParamsSchema, request.params);
    const { message } = parseOrThrow(sendManualReplySchema, request.body);
    return reply.status(201).send({ reply: await sendManualInstagramReply(app, actor as typeof actor & { role: 'INFLUENCER' | 'STORE_OWNER' }, conversationId, message) });
  });
};
