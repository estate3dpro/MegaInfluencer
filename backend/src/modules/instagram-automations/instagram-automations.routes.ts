import type { FastifyPluginAsync } from 'fastify';

import { requireRole } from '../../shared/auth/authorization.js';
import { parseOrThrow } from '../../shared/validation/pagination.js';
import {
  createInstagramAutomation,
  deleteInstagramAutomation,
  getInstagramAutomation,
  getInstagramWebhookLogs,
  listInstagramAutomations,
  updateInstagramAutomation,
} from './instagram-automations.service.js';
import {
  automationParamsSchema,
  createInstagramAutomationSchema,
  updateInstagramAutomationSchema,
} from './instagram-automations.schema.js';

export const instagramAutomationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/instagram-automations', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    return { items: await listInstagramAutomations(app, actor.userId) };
  });

  app.get('/instagram-automations/webhook-logs', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    return getInstagramWebhookLogs(app, actor.userId);
  });

  app.post('/instagram-automations', async (request, reply) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const input = parseOrThrow(createInstagramAutomationSchema, request.body);
    const automation = await createInstagramAutomation(app, actor.userId, input);
    return reply.status(201).send({ automation });
  });

  app.get('/instagram-automations/:automationId', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const { automationId } = parseOrThrow(automationParamsSchema, request.params);
    return { automation: await getInstagramAutomation(app, actor.userId, automationId) };
  });

  app.patch('/instagram-automations/:automationId', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const { automationId } = parseOrThrow(automationParamsSchema, request.params);
    const input = parseOrThrow(updateInstagramAutomationSchema, request.body);
    return { automation: await updateInstagramAutomation(app, actor.userId, automationId, input) };
  });

  app.put('/instagram-automations/:automationId', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const { automationId } = parseOrThrow(automationParamsSchema, request.params);
    const input = parseOrThrow(updateInstagramAutomationSchema, request.body);
    return { automation: await updateInstagramAutomation(app, actor.userId, automationId, input) };
  });

  app.delete('/instagram-automations/:automationId', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const { automationId } = parseOrThrow(automationParamsSchema, request.params);
    return deleteInstagramAutomation(app, actor.userId, automationId);
  });
};

