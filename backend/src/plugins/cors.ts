import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';

import { config } from '../config/env.js';

export function registerCors(app: FastifyInstance) {
  app.register(cors, {
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    origin: (origin, callback) => {
      if (!origin || config.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
  });
}
