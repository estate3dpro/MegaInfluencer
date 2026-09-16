import type { FastifyRequest } from 'fastify';

import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';

export const platformRoles = ['ADMIN', 'STORE_OWNER', 'INFLUENCER'] as const;
export type PlatformRole = (typeof platformRoles)[number];

export interface AuthenticatedActor {
  userId: string;
  role: PlatformRole;
  organizationId?: string;
}

export function requireAuth(request: FastifyRequest): AuthenticatedActor {
  if (!request.actor) {
    throw new UnauthorizedError();
  }

  return request.actor;
}

export function requireRole(request: FastifyRequest, allowedRoles: readonly PlatformRole[]) {
  const actor = requireAuth(request);
  if (!allowedRoles.includes(actor.role)) {
    throw new ForbiddenError();
  }

  return actor;
}
