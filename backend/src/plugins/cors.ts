import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';

import { config } from '../config/env.js';

export function registerCors(app: FastifyInstance) {
  app.register(cors, {
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    origin: (_origin, callback) => {
      // Allow storefront origins (Shopify stores) and client apps to communicate seamlessly
      callback(null, true);
    },
  });
}
