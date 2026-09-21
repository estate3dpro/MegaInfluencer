import type { FastifyInstance } from 'fastify';

import { healthRoutes } from '../modules/health/health.routes.js';
import { adminInfluencerRoutes } from '../modules/admin/influencers.routes.js';
import { adminStoreRoutes } from '../modules/admin/stores.routes.js';
import { storeProductsRoutes } from '../modules/store/products.routes.js';
import { storeOrdersRoutes } from '../modules/store/orders.routes.js';
import { storeCreatorsRoutes } from '../modules/store/creators.routes.js';
import { storeCustomersRoutes } from '../modules/store/customers.routes.js';
import { identityRoutes } from '../modules/identity/identity.routes.js';
import { influencerInstagramRoutes, instagramAuthRoutes, instagramWebhookRoutes } from '../modules/instagram/instagram.routes.js';
import { instagramAutomationRoutes } from '../modules/instagram-automations/instagram-automations.routes.js';
import { campaignRoutes } from '../modules/campaigns/campaigns.routes.js';
import { affiliateLinkRoutes, affiliateShopifyWebhookRoutes, affiliateTrackingRoutes } from '../modules/affiliate-links/affiliate-links.routes.js';
import { influencerDashboardRoutes } from '../modules/influencer-dashboard/influencer-dashboard.routes.js';
import { influencerAnalyticsRoutes } from '../modules/influencer-analytics/influencer-analytics.routes.js';
import { influencerStoresRoutes } from '../modules/influencer-stores/influencer-stores.routes.js';

export function registerRoutes(app: FastifyInstance) {
  app.register(healthRoutes);
  app.register(identityRoutes, { prefix: '/api/v1' });
  app.register(adminInfluencerRoutes, { prefix: '/api/v1' });
  app.register(adminStoreRoutes, { prefix: '/api/v1' });
  app.register(storeProductsRoutes, { prefix: '/api/v1' });
  app.register(storeOrdersRoutes, { prefix: '/api/v1' });
  app.register(storeCreatorsRoutes, { prefix: '/api/v1' });
  app.register(storeCustomersRoutes, { prefix: '/api/v1' });
  app.register(instagramAuthRoutes, { prefix: '/api/v1' });
  app.register(influencerInstagramRoutes, { prefix: '/api/v1' });
  app.register(instagramAutomationRoutes, { prefix: '/api/v1' });
  app.register(campaignRoutes, { prefix: '/api/v1' });
  app.register(affiliateLinkRoutes, { prefix: '/api/v1' });
  app.register(influencerDashboardRoutes, { prefix: '/api/v1' });
  app.register(influencerAnalyticsRoutes, { prefix: '/api/v1' });
  app.register(influencerStoresRoutes, { prefix: '/api/v1' });
  app.register(affiliateTrackingRoutes);
  app.register(instagramWebhookRoutes);
  app.register(affiliateShopifyWebhookRoutes);
}
