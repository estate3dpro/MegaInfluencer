/**
 * High-performance, centralized affiliate commission calculator and batch reconciler.
 * Eliminates repetitive sequential DB round-trips and unifies multi-product & flat rupee rules.
 */

import { ensureCreatorCode } from '../../shared/creator-code.js';

export interface OrderCalculationInput {
  id: string;
  total?: string | number | null;
  financialStatus?: string | null;
  payload?: any;
  raw?: any;
  lineItems?: any[];
  affiliateLinkId?: string | null;
  affiliateLink?: any;
}

export interface StoreReferralPolicy {
  multiProductCommissionMode?: string | null;
  fallbackCommissionRate?: number | null;
  fixedTokensEnabled?: boolean | null;
  percentageEnabled?: boolean | null;
  fixedTokensPerOrder?: number | null;
}

export interface CalculationResult {
  amount: number;
  commissionRate: number;
  commissionType: string;
  status: 'APPROVED' | 'PENDING' | 'REVERSED';
  linkToUse: any;
}

const canonicalId = (val: unknown): string => String(val ?? '').split('/').pop() || '';

export function calculateOrderCommission(
  order: OrderCalculationInput,
  linkToUse: any,
  storeConfig: StoreReferralPolicy | null,
  assignedProductSet: Set<string>,
  autoCommission = true,
  isBarter = false
): CalculationResult {
  const isRefunded =
    String(order.financialStatus ?? '').toLowerCase() === 'refunded' ||
    String(order.financialStatus ?? '').toLowerCase() === 'voided';

  const initialStatus: 'APPROVED' | 'PENDING' | 'REVERSED' = isRefunded
    ? 'REVERSED'
    : autoCommission === false
      ? 'PENDING'
      : 'APPROVED';

  // Barter orders receive 0 monetary sales commission
  if (isBarter) {
    return {
      amount: 0,
      commissionRate: 0,
      commissionType: 'PERCENTAGE',
      status: initialStatus,
      linkToUse,
    };
  }

  const orderAmount = Number(order.total || 0);
  const isFixedLink = linkToUse?.commissionType === 'FIXED_AMOUNT';
  const commissionRate = isFixedLink ? 0 : Number(linkToUse?.commissionRate ?? 10);
  const commissionType = isFixedLink ? 'FIXED_AMOUNT' : 'PERCENTAGE';

  if (isFixedLink) {
    const fixedAmount = Number(linkToUse?.commissionAmount ?? 0);
    return {
      amount: Math.round(fixedAmount * 100) / 100,
      commissionRate: 0,
      commissionType: 'FIXED_AMOUNT',
      status: initialStatus,
      linkToUse,
    };
  }

  const isFlatRupees = Boolean(storeConfig?.fixedTokensEnabled && !storeConfig?.percentageEnabled);
  const isBoth = Boolean(storeConfig?.fixedTokensEnabled && storeConfig?.percentageEnabled);
  const flatRateAmount = Number(storeConfig?.fixedTokensPerOrder ?? 50);

  if (isFlatRupees) {
    return {
      amount: Math.round(flatRateAmount * 100) / 100,
      commissionRate,
      commissionType: 'FLAT_RUPEES',
      status: initialStatus,
      linkToUse,
    };
  }

  // Extract order line items from payload or raw data
  const rawOrder = order.payload ?? order.raw ?? order;
  const lineItems: any[] = Array.isArray(rawOrder?.line_items)
    ? rawOrder.line_items
    : Array.isArray(rawOrder?.lineItems)
      ? rawOrder.lineItems
      : Array.isArray(rawOrder?.lineItems?.nodes)
        ? rawOrder.lineItems.nodes
        : Array.isArray(order.lineItems)
          ? order.lineItems
          : [];

  let assignedItemsTotal = 0;
  let unassignedItemsTotal = 0;
  let hasAssignedProductInCart = false;
  const hasSpecificAssignments = assignedProductSet.size > 0;

  for (const item of lineItems) {
    const itemProdId = canonicalId(item.product_id ?? item.productId ?? item.product?.id);
    const price = Number(item.price ?? 0);
    const quantity = Number(item.quantity ?? 1);
    const itemTotal = price * quantity;

    if (!hasSpecificAssignments || (itemProdId && assignedProductSet.has(itemProdId))) {
      assignedItemsTotal += itemTotal;
      hasAssignedProductInCart = true;
    } else {
      unassignedItemsTotal += itemTotal;
    }
  }

  const mode = storeConfig?.multiProductCommissionMode ?? 'STORE_WIDE';
  const fallbackRate = Number(storeConfig?.fallbackCommissionRate ?? 0);

  let variableAmount = 0;
  if (commissionRate > 0) {
    if (mode === 'ASSIGNED_PRODUCTS_ONLY') {
      variableAmount = (assignedItemsTotal * commissionRate) / 100;
    } else if (mode === 'GATE_REQUIRED') {
      variableAmount = hasAssignedProductInCart ? (orderAmount * commissionRate) / 100 : 0;
    } else if (mode === 'HYBRID_FALLBACK') {
      const assignedComm = (assignedItemsTotal * commissionRate) / 100;
      const unassignedComm = (unassignedItemsTotal * fallbackRate) / 100;
      variableAmount = assignedComm + unassignedComm;
    } else {
      // STORE_WIDE default
      variableAmount = (orderAmount * commissionRate) / 100;
    }
  }

  const finalAmount = isBoth ? flatRateAmount + variableAmount : variableAmount;

  return {
    amount: Math.round(finalAmount * 100) / 100,
    commissionRate,
    commissionType: isBoth ? 'BOTH' : 'PERCENTAGE',
    status: initialStatus,
    linkToUse,
  };
}

/**
 * Reconcile commissions for a list of orders in parallel and attach calculated commissions immediately.
 */
export async function reconcileOrdersCommissions(
  prisma: any,
  organizationId: string,
  creatorId: string,
  orders: any[],
  defaultLink: any,
  storeConfig: StoreReferralPolicy | null,
  assignedProductSet: Set<string>,
  autoCommission = true,
  isBarter = false
): Promise<void> {
  const needsReconciliation = orders.filter((o) => {
    if (!o.affiliateCommissions || o.affiliateCommissions.length === 0) return true;
    const comm = o.affiliateCommissions[0];
    if (!comm.creatorId || comm.creatorId !== creatorId) return true;
    if (comm.status !== 'REVERSED' && Number(comm.amount || 0) === 0 && Number(o.total || 0) > 0 && !isBarter) return true;
    return false;
  });

  if (needsReconciliation.length === 0) return;

  await Promise.all(
    needsReconciliation.map(async (order) => {
      const linkToUse = order.affiliateLink || defaultLink;
      if (!linkToUse?.id) return;

      const calc = calculateOrderCommission(
        order,
        linkToUse,
        storeConfig,
        assignedProductSet,
        autoCommission,
        isBarter
      );

      const commData = {
        organizationId,
        linkId: linkToUse.id,
        creatorId,
        shopifyOrderId: order.id,
        orderAmount: Number(order.total || 0),
        commissionType: calc.commissionType,
        commissionRate: calc.commissionRate,
        amount: calc.amount,
        status: calc.status,
      };

      try {
        const comm = await prisma.affiliateCommission.upsert({
          where: { shopifyOrderId: order.id },
          create: commData,
          update: {
            amount: calc.amount,
            commissionRate: calc.commissionRate,
            commissionType: calc.commissionType,
            linkId: linkToUse.id,
            creatorId,
            status: calc.status,
          },
          include: { link: { select: { slug: true, commissionRate: true } } },
        });
        order.affiliateCommissions = [comm];
      } catch {
        // In case of parallel write contention, re-fetch existing record
        const existing = await prisma.affiliateCommission.findUnique({
          where: { shopifyOrderId: order.id },
          include: { link: { select: { slug: true, commissionRate: true } } },
        });
        if (existing) {
          order.affiliateCommissions = [existing];
        }
      }
    })
  );
}

export interface ReconcileRosterOptions {
  forceRecalculate?: boolean;
}

/**
 * Enterprise store-wide roster reconciliation:
 * Scans all assigned influencers, aligns all affiliate links, discount codes, and Instagram handles,
 * and ensures all attributed store orders have real, verified AffiliateCommission ledger records.
 */
export async function reconcileStoreRosterCommissions(
  prisma: any,
  organizationId: string,
  options: ReconcileRosterOptions = {}
): Promise<{ reconciledCount: number }> {
  // 1. Fetch store referral policy
  const storeConfig: StoreReferralPolicy | null = await prisma.storeReferralConfig.findUnique({
    where: { organizationId },
    select: {
      multiProductCommissionMode: true,
      fallbackCommissionRate: true,
      fixedTokensEnabled: true,
      percentageEnabled: true,
      fixedTokensPerOrder: true,
    },
  });

  // 2. Fetch all assigned influencers in this store
  const assignments = await prisma.storeInfluencerAssignment.findMany({
    where: { organizationId },
    include: {
      influencer: {
        select: {
          id: true,
          displayName: true,
          creatorCode: true,
          email: true,
          instagramConnection: { select: { username: true, status: true } },
          affiliateLinks: {
            where: { organizationId },
            select: { id: true, slug: true, commissionRate: true, commissionType: true, commissionAmount: true, status: true },
          },
          discountCodes: {
            where: { organizationId },
            select: { id: true, code: true },
          },
        },
      },
    },
  });

  if (assignments.length === 0) return { reconciledCount: 0 };

  const codeToCreatorCtx = new Map<string, any>();
  const linkIdToCreatorCtx = new Map<string, any>();

  for (const a of assignments) {
    const inf = a.influencer;
    if (!inf) continue;

    // Ensure influencer has a valid creatorCode
    let code = inf.creatorCode;
    if (!code) {
      try {
        code = await ensureCreatorCode(prisma, inf.id);
        inf.creatorCode = code;
      } catch {
        /* Ignore collision */
      }
    }

    // Ensure influencer has an active default affiliate link
    let defaultLink = (inf.affiliateLinks ?? []).find((l: any) => l.status === 'ACTIVE') || inf.affiliateLinks?.[0];
    if (!defaultLink) {
      try {
        const slug = `link_${(code || inf.id.slice(-6)).toLowerCase()}_${Date.now().toString(36).slice(-4)}`;
        defaultLink = await prisma.affiliateLink.create({
          data: {
            organizationId,
            creatorId: inf.id,
            targetType: 'STORE',
            destinationPath: '/',
            commissionRate: 10,
            slug,
          },
          select: { id: true, slug: true, commissionRate: true, commissionType: true, commissionAmount: true, status: true },
        });
        inf.affiliateLinks = [defaultLink];
      } catch {
        /* Fallback query */
      }
    }

    // Product assignments
    const prodRows = await prisma.productInfluencerAssignment.findMany({
      where: { organizationId, influencerId: inf.id },
      select: { product: { select: { shopifyId: true } } },
    });
    const assignedProductSet = new Set<string>();
    for (const pr of prodRows) {
      const cid = canonicalId(pr.product?.shopifyId);
      if (cid) assignedProductSet.add(cid);
    }

    const isBarter = a.compensationMode === 'BARTER';
    const autoCommission = (a as any).autoCommission ?? true;

    const ctx = {
      influencer: inf,
      assignment: a,
      defaultLink,
      assignedProductSet,
      isBarter,
      autoCommission,
    };

    if (code) {
      codeToCreatorCtx.set(code.toLowerCase(), ctx);
      // Suffix aliasing: e.g. SARAH88_PRO -> also recognize SARAH88
      const baseCode = code.replace(/_pro$/i, '').trim();
      if (baseCode && baseCode.toLowerCase() !== code.toLowerCase()) {
        codeToCreatorCtx.set(baseCode.toLowerCase(), ctx);
      }
    }

    // Instagram username recognition
    if (inf.instagramConnection?.username) {
      codeToCreatorCtx.set(inf.instagramConnection.username.toLowerCase(), ctx);
    }

    // Custom discount codes
    for (const d of inf.discountCodes ?? []) {
      if (d.code) codeToCreatorCtx.set(d.code.toLowerCase(), ctx);
    }

    // Affiliate link slugs and IDs
    for (const l of inf.affiliateLinks ?? []) {
      if (l.slug) codeToCreatorCtx.set(l.slug.toLowerCase(), ctx);
      linkIdToCreatorCtx.set(l.id, ctx);
    }
  }

  // 3. Query all attributed store orders
  const orders = await prisma.shopifyOrder.findMany({
    where: {
      organizationId,
      OR: [
        { creatorCode: { not: null } },
        { affiliateLinkId: { not: null } },
        { affiliateCommissions: { some: { organizationId } } },
      ],
    },
    include: {
      affiliateCommissions: { where: { organizationId } },
      affiliateLink: {
        select: { id: true, slug: true, commissionRate: true, commissionType: true, commissionAmount: true },
      },
    },
  });

  let reconciledCount = 0;
  for (const order of orders) {
    let matchedCtx = null;
    if (order.affiliateLinkId && linkIdToCreatorCtx.has(order.affiliateLinkId)) {
      matchedCtx = linkIdToCreatorCtx.get(order.affiliateLinkId);
    }
    if (!matchedCtx && order.creatorCode) {
      matchedCtx = codeToCreatorCtx.get(order.creatorCode.toLowerCase());
    }

    if (!matchedCtx) continue;

    const existingComm = order.affiliateCommissions?.[0];
    const needsCalculation =
      options.forceRecalculate ||
      !existingComm ||
      !existingComm.creatorId ||
      existingComm.creatorId !== matchedCtx.influencer.id ||
      (existingComm.status !== 'REVERSED' && Number(existingComm.amount || 0) === 0 && Number(order.total || 0) > 0 && !matchedCtx.isBarter);

    if (needsCalculation) {
      const linkToUse = order.affiliateLink || matchedCtx.defaultLink;
      if (!linkToUse?.id) continue;

      const calc = calculateOrderCommission(
        order,
        linkToUse,
        storeConfig,
        matchedCtx.assignedProductSet,
        matchedCtx.autoCommission,
        matchedCtx.isBarter
      );

      await prisma.affiliateCommission.upsert({
        where: { shopifyOrderId: order.id },
        create: {
          organizationId,
          linkId: linkToUse.id,
          creatorId: matchedCtx.influencer.id,
          shopifyOrderId: order.id,
          orderAmount: Number(order.total || 0),
          commissionType: calc.commissionType,
          commissionRate: calc.commissionRate,
          amount: calc.amount,
          status: calc.status,
        },
        update: {
          linkId: linkToUse.id,
          creatorId: matchedCtx.influencer.id,
          orderAmount: Number(order.total || 0),
          commissionType: calc.commissionType,
          commissionRate: calc.commissionRate,
          amount: calc.amount,
          status: calc.status,
        },
      });

      if (!order.affiliateLinkId || order.creatorCode !== matchedCtx.influencer.creatorCode) {
        await prisma.shopifyOrder.update({
          where: { id: order.id },
          data: {
            affiliateLinkId: linkToUse.id,
            creatorCode: matchedCtx.influencer.creatorCode || order.creatorCode,
          },
        }).catch(() => null);
      }

      reconciledCount++;
    }
  }

  return { reconciledCount };
}
