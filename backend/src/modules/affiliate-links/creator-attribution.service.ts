/**
 * The creator workspace must always use the same attribution source as the
 * store workspace.  A commission ledger row is a payout record, not the
 * source of truth for whether an order belongs to a creator: an order may be
 * synced before its ledger row is reconciled.
 */
export async function getCreatorAttributions(
  prisma: any,
  creatorId: string,
  options: { scope?: string; from?: Date; to?: Date } = {},
) {
  const [creator, assignments, creatorLinks] = await Promise.all([
    prisma.user.findUnique({ where: { id: creatorId }, select: { creatorCode: true } }),
    prisma.storeInfluencerAssignment.findMany({
      where: { influencerId: creatorId },
      select: { organizationId: true },
    }),
    prisma.affiliateLink.findMany({
      where: { creatorId },
      select: { organizationId: true },
    }),
  ]);

  const permittedOrganizationIds = [...new Set([
    ...assignments.map((assignment: any) => assignment.organizationId),
    ...creatorLinks.map((link: any) => link.organizationId),
  ])];
  const scopeWhere = options.scope && options.scope !== 'all'
    ? { organization: { OR: [{ id: options.scope }, { slug: options.scope }] } }
    : {};
  const dateWhere = options.from || options.to
    ? { createdAt: { ...(options.from ? { gte: options.from } : {}), ...(options.to ? { lt: options.to } : {}) } }
    : {};
  const codeOrderClause = creator?.creatorCode && permittedOrganizationIds.length
    ? [{
        creatorCode: { equals: creator.creatorCode, mode: 'insensitive' },
        organizationId: { in: permittedOrganizationIds },
      }]
    : [];

  const [orders, commissions] = await Promise.all([
    prisma.shopifyOrder.findMany({
      where: {
        ...scopeWhere,
        ...dateWhere,
        OR: [{ affiliateLink: { creatorId } }, ...codeOrderClause],
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        affiliateLink: {
          select: {
            id: true, slug: true, creatorId: true, productId: true,
            commissionType: true, commissionRate: true, commissionAmount: true,
            product: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.affiliateCommission.findMany({
      where: { creatorId, ...scopeWhere, ...dateWhere },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        shopifyOrder: true,
        link: {
          select: {
            id: true, slug: true, creatorId: true, productId: true,
            commissionType: true, commissionRate: true, commissionAmount: true,
            product: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const commissionsByOrderId = new Map((commissions as any[]).map((commission: any) => [commission.shopifyOrderId, commission]));
  const combined = new Map<string, any>();
  for (const order of orders) {
    const commission: any = commissionsByOrderId.get(order.id);
    const link = commission?.link ?? order.affiliateLink;
    const orderAmount = Number(commission?.orderAmount ?? order.total ?? 0);
    const commissionType = String(commission?.commissionType ?? link?.commissionType ?? 'PERCENTAGE');
    const commissionRate = Number(commission?.commissionRate ?? link?.commissionRate ?? 0);
    const expectedAmount = commission
      ? Number(commission.amount)
      : commissionType === 'FIXED_AMOUNT'
        ? Number(link?.commissionAmount ?? 0)
        : Number(((orderAmount * commissionRate) / 100).toFixed(2));
    combined.set(order.id, {
      id: order.id,
      organizationId: order.organizationId,
      organization: order.organization,
      order,
      link,
      commission,
      orderAmount,
      commissionType,
      commissionRate,
      commissionAmount: expectedAmount,
      status: commission?.status ?? 'PENDING',
      isEstimated: !commission,
      createdAt: commission?.createdAt ?? order.processedAt ?? order.createdAt,
    });
  }

  // Retain valid legacy ledger rows even when their Shopify order was later
  // pruned from the storefront sync.
  for (const commission of commissions) {
    if (combined.has(commission.shopifyOrderId)) continue;
    combined.set(commission.shopifyOrderId, {
      id: commission.shopifyOrderId,
      organizationId: commission.organizationId,
      organization: commission.organization,
      order: commission.shopifyOrder,
      link: commission.link,
      commission,
      orderAmount: Number(commission.orderAmount),
      commissionType: String(commission.commissionType),
      commissionRate: Number(commission.commissionRate),
      commissionAmount: Number(commission.amount),
      status: commission.status,
      isEstimated: false,
      createdAt: commission.createdAt,
    });
  }

  return [...combined.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
