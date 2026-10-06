import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { parseOrThrow } from '../../shared/validation/pagination.js';
import {
  claimRewardSchema,
  createCustomerLinkSchema,
  updateCustomerProfileSchema,
} from './customer.schema.js';
import { getFrontendBaseUrl } from '../../shared/helpers/frontend-url.js';
import {
  claimCustomerMilestone,
  claimCustomerReward,
  createCustomerReferralLink,
  getCustomerDashboard,
  getCustomerLeaderboard,
  getCustomerMilestones,
  getCustomerProfile,
  getCustomerReferralLinks,
  getCustomerReferralsList,
  getCustomerRewardsCatalog,
  getCustomerStores,
  updateCustomerProfile,
} from './customer.service.js';

export const customerRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/v1/customer/profile
  app.get('/customer/profile', async (request) => {
    const actor = requireRole(request, ['CUSTOMER', 'INFLUENCER', 'STORE_OWNER', 'ADMIN']);
    return getCustomerProfile(app, actor.userId);
  });

  // PATCH /api/v1/customer/profile
  app.patch('/customer/profile', async (request) => {
    const actor = requireRole(request, ['CUSTOMER', 'INFLUENCER', 'STORE_OWNER', 'ADMIN']);
    const input = parseOrThrow(updateCustomerProfileSchema, request.body);
    return updateCustomerProfile(app, actor.userId, input);
  });

  // GET /api/v1/customer/stores
  app.get('/customer/stores', async (request) => {
    const actor = requireRole(request, ['CUSTOMER', 'INFLUENCER', 'STORE_OWNER', 'ADMIN']);
    const stores = await getCustomerStores(app, actor.userId);
    return { stores };
  });

  // GET /api/v1/customer/referral-links
  app.get('/customer/referral-links', async (request) => {
    const actor = requireRole(request, ['CUSTOMER', 'INFLUENCER', 'STORE_OWNER', 'ADMIN']);
    const baseUrl = getFrontendBaseUrl(request);
    const links = await getCustomerReferralLinks(app, actor.userId, baseUrl);
    return { links };
  });

  // POST /api/v1/customer/referral-links
  app.post('/customer/referral-links', async (request, reply) => {
    const actor = requireRole(request, ['CUSTOMER', 'INFLUENCER', 'STORE_OWNER', 'ADMIN']);
    const input = parseOrThrow(createCustomerLinkSchema, request.body);
    const baseUrl = getFrontendBaseUrl(request);
    const link = await createCustomerReferralLink(app, actor.userId, input, baseUrl);
    return reply.status(201).send({ link });
  });

  // GET /api/v1/customer/dashboard
  app.get('/customer/dashboard', async (request) => {
    const actor = requireRole(request, ['CUSTOMER', 'INFLUENCER', 'STORE_OWNER', 'ADMIN']);
    const baseUrl = getFrontendBaseUrl(request);
    return getCustomerDashboard(app, actor.userId, baseUrl);
  });

  // GET /api/v1/customer/referrals
  app.get('/customer/referrals', async (request) => {
    const actor = requireRole(request, ['CUSTOMER', 'INFLUENCER', 'STORE_OWNER', 'ADMIN']);
    const referrals = await getCustomerReferralsList(app, actor.userId);
    return { referrals };
  });

  // GET /api/v1/customer/rewards
  app.get('/customer/rewards', async (request) => {
    const actor = requireRole(request, ['CUSTOMER', 'INFLUENCER', 'STORE_OWNER', 'ADMIN']);
    return getCustomerRewardsCatalog(app, actor.userId);
  });

  // POST /api/v1/customer/rewards/claim
  app.post('/customer/rewards/claim', async (request, reply) => {
    const actor = requireRole(request, ['CUSTOMER', 'INFLUENCER', 'STORE_OWNER', 'ADMIN']);
    const input = parseOrThrow(claimRewardSchema, request.body);
    const result = await claimCustomerReward(app, actor.userId, input);
    return reply.status(201).send(result);
  });

  // GET /api/v1/customer/leaderboard
  app.get('/customer/leaderboard', async (request) => {
    const actor = requireRole(request, ['CUSTOMER', 'INFLUENCER', 'STORE_OWNER', 'ADMIN']);
    const query = request.query as any;
    const timeframe = query?.timeframe === 'ALL_TIME' ? 'ALL_TIME' : 'THIS_MONTH';
    return getCustomerLeaderboard(app, actor.userId, timeframe);
  });

  // GET /api/v1/customer/milestones
  app.get('/customer/milestones', async (request) => {
    const actor = requireRole(request, ['CUSTOMER', 'INFLUENCER', 'STORE_OWNER', 'ADMIN']);
    return getCustomerMilestones(app, actor.userId);
  });

  // POST /api/v1/customer/milestones/:id/claim
  app.post('/customer/milestones/:id/claim', async (request, reply) => {
    const actor = requireRole(request, ['CUSTOMER', 'INFLUENCER', 'STORE_OWNER', 'ADMIN']);
    const { id } = request.params as { id: string };
    const result = await claimCustomerMilestone(app, actor.userId, id);
    return reply.status(200).send(result);
  });
};
