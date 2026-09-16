import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected', service: 'mega-influencer-api' };
  });

  app.get('/ready', async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    return { status: 'ready', database: 'connected' };
  });
};
