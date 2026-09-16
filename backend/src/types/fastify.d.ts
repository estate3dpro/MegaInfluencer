import type { PrismaClient } from '@prisma/client';
import type { UserRole } from '@prisma/client';

import type { AuthenticatedActor } from '../shared/auth/authorization.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }

  interface FastifyRequest {
    actor?: AuthenticatedActor;
  }

}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: UserRole; type?: 'access' | 'refresh' };
    user: { sub: string; role: UserRole; type?: 'access' | 'refresh' };
  }
}
