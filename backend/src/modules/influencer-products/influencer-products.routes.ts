import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';
import { getAssignedProductIds } from '../product-assignments/product-assignments.service.js';
import { config } from '../../config/env.js';

const inrFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatCurrency(amount: number): string {
  return inrFormat.format(amount);
}

export const influencerProductsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/influencer/products', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const query = request.query as { search?: string; storeSlug?: string; campaignId?: string };
    const baseUrl = config.publicBaseUrl ?? `http://${request.headers.host}`;

    // Campaign links resolve their product from the campaign itself. This
    // also supports accepted campaigns created before product assignments.
    if (query.campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: {
          id: query.campaignId,
          deletedAt: null,
          productId: { not: null },
          OR: [
            { assignments: { some: { influencerId: actor.userId, status: 'ASSIGNED' } } },
            { applications: { some: { influencerId: actor.userId, status: 'ACCEPTED' } } },
          ],
        },
        include: {
          organization: { select: { id: true, name: true, slug: true } },
          product: {
            include: {
              affiliateLinks: {
                where: { creatorId: actor.userId },
                include: { _count: { select: { clicks: true, commissions: true } } },
              },
            },
          },
        },
      });

      if (!campaign?.product) return { products: [], stores: [] };

      const product = campaign.product;
      const userLink = product.affiliateLinks?.[0];
      const price = Number(product.price || 0);
      return {
        products: [{
          id: product.id,
          name: product.title,
          store: campaign.organization.name,
          storeSlug: campaign.organization.slug || campaign.organization.id,
          price: price > 0 ? formatCurrency(price) : (product.price ? `₹${product.price}` : '₹0.00'),
          orders: userLink?._count?.commissions ?? 0,
          tone: 'bg-primary/10 text-primary',
          imageUrl: product.imageUrl ?? null,
          handle: product.handle ?? null,
          affiliateSlug: userLink?.slug ?? null,
          affiliateUrl: userLink ? `${baseUrl}/r/${userLink.slug}` : null,
        }],
        stores: [{ id: campaign.organization.id, name: campaign.organization.name, slug: campaign.organization.slug || campaign.organization.id }],
      };
    }

    // 1. Fetch assigned organizations only
    const assignments = await prisma.storeInfluencerAssignment.findMany({
      where: { influencerId: actor.userId },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    let stores = assignments.map((a: any) => a.organization).filter(Boolean);

    if (!stores.length) {
      const creatorLinks = await prisma.affiliateLink.findMany({
        where: { creatorId: actor.userId },
        select: {
          organization: { select: { id: true, name: true, slug: true } },
        },
        distinct: ['organizationId'],
      });
      stores = creatorLinks.map((l: any) => l.organization).filter(Boolean);
    }

    const orgIds = stores.map((s: any) => s.id).filter(Boolean);

    if (orgIds.length === 0) {
      return {
        products: [],
        stores: [],
      };
    }

    // 2. Fetch products for assigned organizations strictly checking product assignments
    const assignedProductIds = await getAssignedProductIds(prisma, actor.userId);

    // If the store admin has not assigned any specific products to this creator yet, return empty list
    if (assignedProductIds.length === 0) {
      return {
        products: [],
        stores: stores.map((s: any) => ({ id: s.id, name: s.name, slug: s.slug || s.id })),
      };
    }

    let whereClause: any = {
      organizationId: { in: orgIds },
      id: { in: assignedProductIds },
    };

    if (query.storeSlug && query.storeSlug !== 'all') {
      const selectedOrg = stores.find((s: any) => s.slug === query.storeSlug || s.id === query.storeSlug);
      if (selectedOrg) {
        whereClause.organizationId = selectedOrg.id;
      }
    }

    if (query.search) {
      whereClause.title = { contains: query.search, mode: 'insensitive' };
    }

    const dbProducts = await prisma.shopifyProduct.findMany({
      where: whereClause,
      include: {
        organization: { select: { name: true, slug: true } },
        affiliateLinks: {
          where: { creatorId: actor.userId },
          include: {
            _count: { select: { clicks: true, commissions: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const tones = [
      'bg-violet-100 text-violet-600',
      'bg-rose-100 text-rose-600',
      'bg-teal-100 text-teal-600',
      'bg-amber-100 text-amber-600',
      'bg-indigo-100 text-indigo-600',
      'bg-emerald-100 text-emerald-600',
    ];

    const products = dbProducts.map((p: any, idx: number) => {
      const userLink = p.affiliateLinks?.[0];
      const ordersCount = userLink?._count?.commissions ?? 0;
      const numPrice = Number(p.price || 0);

      return {
        id: p.id,
        name: p.title,
        store: p.organization?.name || 'Brand Store',
        storeSlug: p.organization?.slug || 'store',
        price: numPrice > 0 ? formatCurrency(numPrice) : (p.price ? `₹${p.price}` : '₹0.00'),
        orders: ordersCount,
        tone: tones[idx % tones.length],
        imageUrl: p.imageUrl ?? null,
        handle: p.handle ?? null,
        affiliateSlug: userLink?.slug ?? null,
        affiliateUrl: userLink ? `${baseUrl}/r/${userLink.slug}` : null,
      };
    });

    return {
      products,
      stores: stores.map((s: any) => ({ id: s.id, name: s.name, slug: s.slug || s.id })),
    };
  });
};
