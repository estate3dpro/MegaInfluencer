import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { requireRole } from '../../shared/auth/authorization.js';
import { parseOrThrow } from '../../shared/validation/pagination.js';
import { getAdminInfluencer, getAdminInfluencerInstagramProfile, listAdminInfluencers, updateAdminInfluencerStatus } from './influencers.service.js';
import { getAssignedProductIds, setCreatorProductAssignments } from '../product-assignments/product-assignments.service.js';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().min(1).max(100).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
});
const influencerParamsSchema = z.object({ influencerId: z.string().cuid() });
const updateStatusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) });

export const adminInfluencerRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/admin/influencers', async (request) => {
    requireRole(request, ['ADMIN']);
    const query = parseOrThrow(listQuerySchema, request.query);
    return listAdminInfluencers(app, query);
  });

  app.get('/admin/influencers/:influencerId', async (request) => {
    requireRole(request, ['ADMIN']);
    const { influencerId } = parseOrThrow(influencerParamsSchema, request.params);
    return { influencer: await getAdminInfluencer(app, influencerId) };
  });

  app.get('/admin/influencers/:influencerId/instagram-profile', async (request) => {
    requireRole(request, ['ADMIN']);
    const { influencerId } = parseOrThrow(influencerParamsSchema, request.params);
    return getAdminInfluencerInstagramProfile(app, influencerId);
  });

  app.patch('/admin/influencers/:influencerId/status', async (request) => {
    const actor = requireRole(request, ['ADMIN']);
    const { influencerId } = parseOrThrow(influencerParamsSchema, request.params);
    const { status } = parseOrThrow(updateStatusSchema, request.body);
    return { influencer: await updateAdminInfluencerStatus(app, actor.userId, influencerId, status) };
  });

  // GET influencer assigned products across stores
  app.get('/admin/influencers/:influencerId/products', async (request) => {
    requireRole(request, ['ADMIN']);
    const { influencerId } = parseOrThrow(influencerParamsSchema, request.params);

    const storeAssignments = await prisma.storeInfluencerAssignment.findMany({
      where: { influencerId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            shopifyProducts: {
              select: {
                id: true,
                title: true,
                price: true,
                imageUrl: true,
                handle: true,
                vendor: true,
              },
            },
          },
        },
      },
    });

    const assignedProductIds = await getAssignedProductIds(prisma, influencerId);
    const assignedSet = new Set(assignedProductIds);

    const stores = storeAssignments.map((sa: any) => ({
      id: sa.organization.id,
      name: sa.organization.name,
      slug: sa.organization.slug,
      products: sa.organization.shopifyProducts.map((p: any) => ({
        ...p,
        isAssigned: assignedSet.has(p.id),
      })),
    }));

    return {
      stores,
      assignedCount: assignedSet.size,
    };
  });

  // PUT update influencer assigned products
  app.put('/admin/influencers/:influencerId/products', async (request) => {
    requireRole(request, ['ADMIN']);
    const { influencerId } = parseOrThrow(influencerParamsSchema, request.params);
    const body = request.body as { storeId?: string; productIds: string[] };
    const productIds = Array.isArray(body?.productIds) ? body.productIds : [];

    const products = await prisma.shopifyProduct.findMany({
      where: { id: { in: productIds } },
      select: { id: true, organizationId: true },
    });

    // Group by organization
    const orgProductMap = new Map<string, string[]>();
    for (const p of products) {
      if (!orgProductMap.has(p.organizationId)) {
        orgProductMap.set(p.organizationId, []);
      }
      orgProductMap.get(p.organizationId)!.push(p.id);
    }

    if (body.storeId) {
      const pIds = orgProductMap.get(body.storeId) || [];
      await setCreatorProductAssignments(prisma, body.storeId, influencerId, pIds);
    } else {
      // Clear all and reassign
      const storeAssignments = await prisma.storeInfluencerAssignment.findMany({
        where: { influencerId },
        select: { organizationId: true },
      });
      for (const sa of storeAssignments) {
        const pIds = orgProductMap.get(sa.organizationId) || [];
        await setCreatorProductAssignments(prisma, sa.organizationId, influencerId, pIds);
      }
    }

    return { ok: true, assignedCount: products.length };
  });
};
