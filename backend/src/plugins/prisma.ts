import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

import { config } from '../config/env.js';

export function registerPrisma(app: FastifyInstance) {
  const prisma = new PrismaClient({
    datasources: { db: { url: config.databaseUrl } },
  });

  app.decorate('prisma', prisma);
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
}
