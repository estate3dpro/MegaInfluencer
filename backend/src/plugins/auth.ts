import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';
import type { UserRole } from '@prisma/client';

import { config } from '../config/env.js';
import { UnauthorizedError } from '../shared/errors/app-error.js';

export function registerAuth(app: FastifyInstance) {
  app.register(fastifyJwt, { secret: config.jwtSecret, sign: { expiresIn: '15m' } });
  app.decorateRequest('actor');

  app.addHook('onRequest', async (request) => {
    if (!request.headers.authorization) return;

    try {
      const token = await request.jwtVerify<{ sub: string; role: UserRole; type?: 'access' | 'refresh' }>();
      if (token.type === 'refresh') {
        throw new UnauthorizedError('A refresh token cannot access this resource.');
      }
      const user = await app.prisma.user.findUnique({
        where: { id: token.sub },
        select: { id: true, role: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Your account is unavailable.');
      }

      request.actor = { userId: user.id, role: user.role };
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError('Your access token is invalid or expired.');
    }
  });
}
