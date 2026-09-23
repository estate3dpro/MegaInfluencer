import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { parseOrThrow } from '../../shared/validation/pagination.js';
import { directConversationParamsSchema, sendDirectMessageSchema } from './instagram-direct-inbox.schema.js';
import { listInstagramDirectConversations, sendDirectInboxMessage } from './instagram-direct-inbox.service.js';

export const instagramDirectInboxRoutes: FastifyPluginAsync = async (app) => {
  app.get('/instagram-direct-inbox', async (request) => {
    const actor = requireRole(request, ['INFLUENCER', 'STORE_OWNER']) as typeof request.actor & { role: 'INFLUENCER' | 'STORE_OWNER' };
    return { items: await listInstagramDirectConversations(app, actor) };
  });
  app.post('/instagram-direct-inbox/:conversationId/messages', async (request, reply) => {
    const actor = requireRole(request, ['INFLUENCER', 'STORE_OWNER']) as typeof request.actor & { role: 'INFLUENCER' | 'STORE_OWNER' };
    const { conversationId } = parseOrThrow(directConversationParamsSchema, request.params);
    const { message } = parseOrThrow(sendDirectMessageSchema, request.body);
    return reply.status(201).send({ message: await sendDirectInboxMessage(app, actor, conversationId, message) });
  });
};
