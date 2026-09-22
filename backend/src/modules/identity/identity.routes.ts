import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { requireRole } from '../../shared/auth/authorization.js';
import { parseOrThrow, paginationQuerySchema } from '../../shared/validation/pagination.js';
import {
  createOrganization,
  getOwnedOrganization,
  loginUser,
  refreshUserSession,
  registerUser,
  updateOwnedOrganization,
  updateUserStatus,
} from './identity.service.js';
import { loginSchema, organizationSchema, registerSchema, updateOrganizationSchema, updateUserStatusSchema } from './identity.schema.js';

export const identityRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/register', async (request, reply) => {
    const input = parseOrThrow(registerSchema, request.body);
    const user = await registerUser(app, input);
    return reply.status(201).send({ user });
  });

  app.post('/auth/login', async (request) => {
    const input = parseOrThrow(loginSchema, request.body);
    return loginUser(app, input);
  });

  app.post('/auth/refresh', async (request) => {
    const input = parseOrThrow(z.object({ refreshToken: z.string().min(1) }), request.body);
    return refreshUserSession(app, input.refreshToken);
  });

  app.get('/me', async (request) => {
    const actor = requireRole(request, ['ADMIN', 'STORE_OWNER', 'INFLUENCER']);
    const user = await app.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { id: true, email: true, displayName: true, role: true, status: true },
    });
    return { user };
  });

  app.post('/organizations', async (request, reply) => {
    const actor = requireRole(request, ['STORE_OWNER']);
    const input = parseOrThrow(organizationSchema, request.body);
    const organization = await createOrganization(app, actor.userId, input);
    return reply.status(201).send({ organization });
  });

  app.get('/organizations/current', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']);
    const organization = await getOwnedOrganization(app, actor.userId);
    return { organization };
  });

  app.patch('/organizations/current', async (request) => {
    const actor = requireRole(request, ['STORE_OWNER']);
    const input = parseOrThrow(updateOrganizationSchema, request.body);
    const organization = await updateOwnedOrganization(app, actor.userId, input);
    return { organization };
  });


  app.patch('/admin/users/:userId/status', async (request) => {
    const actor = requireRole(request, ['ADMIN']);
    const params = parseOrThrow(z.object({ userId: z.string().cuid() }), request.params);
    const input = parseOrThrow(updateUserStatusSchema, request.body);
    const user = await updateUserStatus(app, actor.userId, params.userId, input.status);
    return { user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, status: user.status } };
  });
};
