import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { requireRole } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { parseOrThrow } from '../../shared/validation/pagination.js';
import { applicationSchema, campaignInputSchema, idSchema } from './campaigns.schema.js';
import * as service from './campaigns.service.js';

const campaignStatusBodySchema = z.object({ status: service.campaignStatusSchema });
const influencerIdBodySchema = z.object({ influencerId: z.string().cuid() });
const notificationIdSchema = z.object({ notificationId: z.string().cuid() });

export const campaignRoutes: FastifyPluginAsync = async (app) => {
  app.get('/store/campaigns', async (request) => {
    const auth = requireRole(request, ['STORE_OWNER']);
    return { items: await service.listStore(app, auth.userId) };
  });
  app.get('/store/campaigns/:campaignId', async (request) => {
    const auth = requireRole(request, ['STORE_OWNER']);
    const { campaignId } = parseOrThrow(idSchema.pick({ campaignId: true }), request.params);
    return { campaign: await service.getStoreCampaign(app, auth.userId, campaignId) };
  });
  app.get('/store/campaigns/:campaignId/influencers', async (request) => {
    const auth = requireRole(request, ['STORE_OWNER']);
    const { campaignId } = parseOrThrow(idSchema.pick({ campaignId: true }), request.params);
    return { influencers: await service.eligibleInfluencers(app, auth.userId, campaignId) };
  });
  app.post('/store/campaigns/:campaignId/assignments', async (request, reply) => {
    const auth = requireRole(request, ['STORE_OWNER']);
    const { campaignId } = parseOrThrow(idSchema.pick({ campaignId: true }), request.params);
    const { influencerId } = parseOrThrow(influencerIdBodySchema, request.body);
    return reply.status(201).send({ assignment: await service.manuallyAssign(app, auth.userId, campaignId, influencerId) });
  });
  app.post('/store/campaigns', async (request, reply) => {
    const auth = requireRole(request, ['STORE_OWNER']);
    const input = parseOrThrow(campaignInputSchema, request.body);
    return reply.status(201).send({ campaign: await service.create(app, auth.userId, input) });
  });
  app.patch('/store/campaigns/:campaignId', async (request) => {
    const auth = requireRole(request, ['STORE_OWNER']);
    const { campaignId } = parseOrThrow(idSchema.pick({ campaignId: true }), request.params);
    const input = parseOrThrow(campaignInputSchema, request.body);
    return { campaign: await service.update(app, auth.userId, campaignId, input) };
  });
  app.patch('/store/campaigns/:campaignId/status', async (request) => {
    const auth = requireRole(request, ['STORE_OWNER']);
    const { campaignId } = parseOrThrow(idSchema.pick({ campaignId: true }), request.params);
    const { status } = parseOrThrow(campaignStatusBodySchema, request.body);
    return { campaign: await service.setStatus(app, auth.userId, campaignId, status) };
  });
  app.delete('/store/campaigns/:campaignId', async (request, reply) => {
    const auth = requireRole(request, ['STORE_OWNER']);
    const { campaignId } = parseOrThrow(idSchema.pick({ campaignId: true }), request.params);
    await service.softDelete(app, auth.userId, campaignId);
    return reply.status(204).send();
  });
  app.post('/store/campaigns/:campaignId/publish', async (request) => {
    const auth = requireRole(request, ['STORE_OWNER']);
    const { campaignId } = parseOrThrow(idSchema.pick({ campaignId: true }), request.params);
    return { campaign: await service.publish(app, auth.userId, campaignId) };
  });
  app.get('/store/campaigns/:campaignId/applications', async (request) => {
    const auth = requireRole(request, ['STORE_OWNER']);
    const { campaignId } = parseOrThrow(idSchema.pick({ campaignId: true }), request.params);
    return { items: await service.applications(app, auth.userId, campaignId) };
  });
  app.post('/store/campaigns/:campaignId/applications/:applicationId/:decision', async (request) => {
    const auth = requireRole(request, ['STORE_OWNER']);
    const params = parseOrThrow(idSchema.extend({ decision: service.decisionSchema }), request.params);
    return { application: await service.decide(app, auth.userId, params.campaignId, params.applicationId, params.decision) };
  });
  app.get('/influencer/discover-campaigns', async (request) => {
    const auth = requireRole(request, ['INFLUENCER']);
    return { items: await service.discover(app, auth.userId) };
  });
  app.get('/influencer/campaigns', async (request) => {
    const auth = requireRole(request, ['INFLUENCER']);
    return { items: await service.assignedCampaigns(app, auth.userId) };
  });
  app.post('/influencer/discover-campaigns/:campaignId/applications', async (request, reply) => {
    const auth = requireRole(request, ['INFLUENCER']);
    const { campaignId } = parseOrThrow(idSchema.pick({ campaignId: true }), request.params);
    const input = parseOrThrow(applicationSchema, request.body);
    return reply.status(201).send({ application: await service.apply(app, auth.userId, campaignId, input) });
  });
  app.get('/notifications', async (request) => {
    const auth = requireRole(request, ['ADMIN', 'STORE_OWNER', 'INFLUENCER']);
    const items = await app.prisma.notification.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { items };
  });
  app.patch('/notifications/:notificationId/read', async (request) => {
    const auth = requireRole(request, ['ADMIN', 'STORE_OWNER', 'INFLUENCER']);
    const { notificationId } = parseOrThrow(notificationIdSchema, request.params);
    const notification = await app.prisma.notification.findFirst({ where: { id: notificationId, userId: auth.userId } });
    if (!notification) throw new AppError('NOTIFICATION_NOT_FOUND', 'Notification was not found.', 404);
    return { notification: await app.prisma.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } }) };
  });
  app.patch('/notifications/read-all', async (request) => {
    const auth = requireRole(request, ['ADMIN', 'STORE_OWNER', 'INFLUENCER']);
    await app.prisma.notification.updateMany({ where: { userId: auth.userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  });
};
