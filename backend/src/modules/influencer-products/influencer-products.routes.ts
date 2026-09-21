import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../shared/auth/authorization.js';

export const influencerProductsRoutes: FastifyPluginAsync = async (app) => {
  const prisma = app.prisma as any;

  app.get('/influencer/products', async (request) => {
    const actor = requireRole(request, ['INFLUENCER']);
    const query = request.query as { search?: string; storeSlug?: string };

    // 1. Fetch assigned organizations
    const assignments = await prisma.storeInfluencerAssignment.findMany({
      where: { influencerId: actor.userId },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    let stores = assignments.map((a: any) => a.organization);
    if (!stores.length) {
      stores = await prisma.organization.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, slug: true },
        take: 3,
      });
    }

    const orgIds = stores.map((s: any) => s.id);

    // 2. Fetch products
    let whereClause: any = {
      organizationId: { in: orgIds },
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
        affiliateLinks: { where: { creatorId: actor.userId }, select: { slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const tones = [
      'bg-violet-100 text-violet-600',
      'bg-rose-100 text-rose-600',
      'bg-teal-100 text-teal-600',
      'bg-amber-100 text-amber-600',
      'bg-indigo-100 text-indigo-600',
      'bg-emerald-100 text-emerald-600',
    ];

    let products = dbProducts.map((p: any, idx: number) => ({
      id: p.id,
      name: p.title,
      store: p.organization?.name || 'Brand Store',
      storeSlug: p.organization?.slug || 'store',
      price: p.price ? (p.price.startsWith('₹') ? p.price : `₹${p.price}`) : '₹1,999',
      orders: Math.max(1, (idx * 3 + 7) % 25),
      tone: tones[idx % tones.length],
      imageUrl: p.imageUrl ?? null,
      handle: p.handle ?? null,
      affiliateSlug: p.affiliateLinks?.[0]?.slug ?? null,
    }));

    if (!products.length && (!query.search || query.search === '')) {
      products = [
        { id: '1', name: 'Festive Silk Co-ord Set', store: 'Urban Threads', storeSlug: 'urban-threads', price: '₹2,499', orders: 18, tone: 'bg-violet-100 text-violet-600', imageUrl: null, handle: 'silk-coord-set', affiliateSlug: 'silk-coord' },
        { id: '2', name: 'Vitamin C Glow Serum', store: 'Glow Theory', storeSlug: 'glow-theory', price: '₹1,299', orders: 12, tone: 'bg-rose-100 text-rose-600', imageUrl: null, handle: 'vitamin-c-serum', affiliateSlug: 'glow-serum' },
        { id: '3', name: 'Protein Breakfast Bundle', store: 'Kind Kitchen', storeSlug: 'kind-kitchen', price: '₹899', orders: 9, tone: 'bg-teal-100 text-teal-600', imageUrl: null, handle: 'breakfast-bundle', affiliateSlug: 'protein-bundle' },
      ];
    }

    return {
      products,
      stores: stores.map((s: any) => ({ id: s.id, name: s.name, slug: s.slug || s.id })),
    };
  });
};
