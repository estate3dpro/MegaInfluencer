import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { requireRole } from '../../shared/auth/authorization.js';
import { parseOrThrow } from '../../shared/validation/pagination.js';
import { getAdminInfluencer, getAdminInfluencerInstagramProfile, listAdminInfluencers, updateAdminInfluencerStatus } from './influencers.service.js';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().min(1).max(100).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
});
const influencerParamsSchema = z.object({ influencerId: z.string().cuid() });
const updateStatusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) });

export const adminInfluencerRoutes: FastifyPluginAsync = async (app) => {
  app.get('/admin/influencers', async (request) => {
    requireRole(request, ['ADMIN']);
    const query = parseOrThrow(listQuerySchema, request.query);
    return listAdminInfluencers(app, query);
  });

  app.get('/admin/influencers/:influencerId', async (request) => {
    requireRole(request, ['ADMIN']);
    const { influencerId } = parseOrThrow(influencerParamsSchema, request.params);
    return { influencer: await getAdminInfluencer(app, influencerId) };
  });

  app.get('/admin/influencers/:influencerId/instagram-profile', async (request) => {
    requireRole(request, ['ADMIN']);
    const { influencerId } = parseOrThrow(influencerParamsSchema, request.params);
    return getAdminInfluencerInstagramProfile(app, influencerId);
  });

  app.patch('/admin/influencers/:influencerId/status', async (request) => {
    const actor = requireRole(request, ['ADMIN']);
    const { influencerId } = parseOrThrow(influencerParamsSchema, request.params);
    const { status } = parseOrThrow(updateStatusSchema, request.body);
    return { influencer: await updateAdminInfluencerStatus(app, actor.userId, influencerId, status) };
  });
};
