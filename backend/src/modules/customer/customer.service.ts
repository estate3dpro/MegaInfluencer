import { randomBytes, randomInt } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors/app-error.js';
import { ensureCreatorCode } from '../../shared/creator-code.js';
import { config } from '../../config/env.js';
import { getFrontendBaseUrl } from '../../shared/helpers/frontend-url.js';

function generateRandomSlug(prefix = 'cust') {
  return `${prefix}-${randomBytes(4).toString('hex')}`;
}

function calculateTier(totalReferrals: number, totalEarned: number): { tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'; nextTier: string | null; progress: number; perks: string[] } {
  if (totalReferrals >= 50 || totalEarned >= 25000) {
    return {
      tier: 'PLATINUM',
      nextTier: null,
      progress: 100,
      perks: ['15% Bonus Rewards', 'Instant Payouts', 'Exclusive VIP Gift Cards', 'Direct Store Concierge'],
    };
  }
  if (totalReferrals >= 20 || totalEarned >= 10000) {
    const progress = Math.min(100, Math.round((totalReferrals / 50) * 100));
    return {
      tier: 'GOLD',
      nextTier: 'PLATINUM',
      progress,
      perks: ['10% Bonus Rewards', 'Priority Payout Processing', 'Custom Referral Slugs', 'VIP Discount Vouchers'],
    };
  }
  if (totalReferrals >= 5 || totalEarned >= 2500) {
    const progress = Math.min(100, Math.round((totalReferrals / 20) * 100));
    return {
      tier: 'SILVER',
      nextTier: 'GOLD',
      progress,
      perks: ['5% Bonus Rewards', 'Standard Payouts', 'Product Referral Links', 'Exclusive Seasonal Promos'],
    };
  }
  const progress = Math.min(100, Math.round((totalReferrals / 5) * 100));
  return {
    tier: 'BRONZE',
    nextTier: 'SILVER',
    progress,
    perks: ['Standard 10% Referral Rewards', 'Store Coupon Redemptions', 'Live Analytics Tracking'],
  };
}

export async function getOrCreateCustomerProfile(prisma: any, userId: string) {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customerProfile: true },
  });

  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  if (!user.creatorCode) {
    const code = await ensureCreatorCode(prisma, userId);
    user.creatorCode = code;
  }

  if (!user.customerProfile) {
    const profile = await prisma.customerProfile.create({
      data: {
        userId,
        tier: 'BRONZE',
        pointsBalance: 100, // 100 bonus welcome points
        totalEarned: 0,
      },
    });
    user.customerProfile = profile;
  }

  return user;
}

export async function getCustomerProfile(app: FastifyInstance, userId: string) {
  const user = await getOrCreateCustomerProfile(app.prisma, userId);
  
  // Calculate aggregated earnings from commissions
  const commissions = await app.prisma.affiliateCommission.findMany({
    where: { creatorId: userId },
    select: { amount: true, status: true },
  });

  const totalEarnedCommissions = commissions
    .filter((c: any) => c.status === 'APPROVED' || c.status === 'PAID')
    .reduce((sum: number, c: any) => sum + Number(c.amount), 0);

  const pendingCommissions = commissions
    .filter((c: any) => c.status === 'PENDING')
    .reduce((sum: number, c: any) => sum + Number(c.amount), 0);

  const totalReferralsCount = commissions.filter((c: any) => c.status !== 'REVERSED').length;
  const tierInfo = calculateTier(totalReferralsCount, totalEarnedCommissions);

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    creatorCode: user.creatorCode,
    phone: user.customerProfile?.phone ?? null,
    avatarUrl: user.customerProfile?.avatarUrl ?? null,
    tier: tierInfo.tier,
    tierDetails: tierInfo,
    pointsBalance: user.customerProfile?.pointsBalance ?? 100,
    totalEarned: totalEarnedCommissions,
    pendingRewards: pendingCommissions,
    payoutMethod: user.customerProfile?.payoutMethod ?? null,
    payoutDetails: user.customerProfile?.payoutDetails ?? null,
    createdAt: user.createdAt,
  };
}

export async function updateCustomerProfile(
  app: FastifyInstance,
  userId: string,
  input: {
    displayName?: string;
    phone?: string | null;
    avatarUrl?: string | null;
    payoutMethod?: 'UPI' | 'PAYPAL' | 'BANK' | 'STORE_CREDIT' | null;
    payoutDetails?: any;
  },
) {
  await getOrCreateCustomerProfile(app.prisma, userId);

  if (input.displayName) {
    await app.prisma.user.update({
      where: { id: userId },
      data: { displayName: input.displayName },
    });
  }

  const profileUpdateData: any = {};
  if (input.phone !== undefined) profileUpdateData.phone = input.phone;
  if (input.avatarUrl !== undefined) profileUpdateData.avatarUrl = input.avatarUrl;
  if (input.payoutMethod !== undefined) profileUpdateData.payoutMethod = input.payoutMethod;
  if (input.payoutDetails !== undefined) profileUpdateData.payoutDetails = input.payoutDetails;

  if (Object.keys(profileUpdateData).length > 0) {
    await app.prisma.customerProfile.update({
      where: { userId },
      data: profileUpdateData,
    });
  }

  return getCustomerProfile(app, userId);
}

export async function getCustomerStores(app: FastifyInstance, userId: string) {
  const user = await getOrCreateCustomerProfile(app.prisma, userId);

  const [stores, activeCustomerLinks] = await Promise.all([
    app.prisma.organization.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        category: true,
        shopDomain: true,
        createdAt: true,
        _count: { select: { shopifyProducts: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    app.prisma.affiliateLink.findMany({
      where: { creatorId: userId },
      select: { organizationId: true, id: true, slug: true },
    }),
  ]);

  const linksByStore = new Map(activeCustomerLinks.map((l: any) => [l.organizationId, l]));

  return stores.map((store: any) => {
    const existingLink = linksByStore.get(store.id);
    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      logoUrl: store.logoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80',
      category: store.category || 'General E-Commerce',
      shopDomain: store.shopDomain,
      productCount: store._count.shopifyProducts,
      rewardRatePercent: 10, // Standard 10% cash/points referral reward
      friendDiscountPercent: 10, // Friends get 10% off
      hasActiveLink: Boolean(existingLink),
      activeLinkSlug: existingLink?.slug ?? null,
    };
  });
}

export async function getCustomerReferralLinks(app: FastifyInstance, userId: string, customBaseUrl?: string) {
  const user = await getOrCreateCustomerProfile(app.prisma, userId);
  const baseUrl = (customBaseUrl || getFrontendBaseUrl()).replace(/\/+$/, '');

  // Ensure default link for the first store exists if none exists
  const existingLinksCount = await app.prisma.affiliateLink.count({ where: { creatorId: userId } });
  if (existingLinksCount === 0) {
    const firstStore = await app.prisma.organization.findFirst({ where: { status: 'ACTIVE' } });
    if (firstStore) {
      await app.prisma.affiliateLink.create({
        data: {
          organizationId: firstStore.id,
          creatorId: userId,
          slug: `${user.creatorCode?.toLowerCase() || 'ref'}-${randomBytes(3).toString('hex')}`,
          targetType: 'STORE',
          destinationPath: '/',
          commissionRate: 10,
        },
      });
    }
  }

  const links = await app.prisma.affiliateLink.findMany({
    where: { creatorId: userId },
    include: {
      organization: { select: { id: true, name: true, slug: true, logoUrl: true, shopDomain: true } },
      product: { select: { id: true, title: true, imageUrl: true, price: true, currency: true } },
      _count: { select: { clicks: true } },
      commissions: { select: { orderAmount: true, amount: true, status: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return links.map((link: any) => {
    const clicks = link._count.clicks;
    const validCommissions = link.commissions.filter((c: any) => c.status !== 'REVERSED');
    const orders = validCommissions.length;
    const totalSales = validCommissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount), 0);
    const totalEarned = validCommissions.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
    const conversionRate = clicks > 0 ? Math.round((orders / clicks) * 1000) / 10 : 0;
    const shareUrl = `${baseUrl}/r/${link.slug}`;

    return {
      id: link.id,
      slug: link.slug,
      shareUrl,
      targetType: link.targetType,
      store: {
        id: link.organization.id,
        name: link.organization.name,
        slug: link.organization.slug,
        logoUrl: link.organization.logoUrl,
        shopDomain: link.organization.shopDomain,
      },
      product: link.product
        ? {
            id: link.product.id,
            title: link.product.title,
            imageUrl: link.product.imageUrl,
            price: link.product.price,
            currency: link.product.currency || 'INR',
          }
        : null,
      commissionRate: Number(link.commissionRate),
      status: link.status,
      clicks,
      orders,
      totalSales,
      totalEarned,
      conversionRate,
      createdAt: link.createdAt,
    };
  });
}

export async function createCustomerReferralLink(
  app: FastifyInstance,
  userId: string,
  input: { storeId: string; productId?: string | null; customSlug?: string | null },
  customBaseUrl?: string,
) {
  const user = await getOrCreateCustomerProfile(app.prisma, userId);

  const store = await app.prisma.organization.findUnique({
    where: { id: input.storeId },
  });
  if (!store) throw new AppError('STORE_NOT_FOUND', 'Store not found.', 404);

  let product = null;
  if (input.productId) {
    product = await app.prisma.shopifyProduct.findFirst({
      where: { id: input.productId, organizationId: store.id },
    });
    if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Product not found in this store.', 404);
  }

  let finalSlug = input.customSlug?.toLowerCase();
  if (finalSlug) {
    const existing = await app.prisma.affiliateLink.findUnique({ where: { slug: finalSlug } });
    if (existing) throw new AppError('SLUG_IN_USE', 'This referral link slug is already taken. Please choose another.', 409);
  } else {
    finalSlug = `${user.creatorCode?.toLowerCase() || 'ref'}-${randomBytes(3).toString('hex')}`;
  }

  const link = await app.prisma.affiliateLink.create({
    data: {
      organizationId: store.id,
      creatorId: userId,
      productId: product?.id || null,
      targetType: product ? 'PRODUCT' : 'STORE',
      destinationPath: product?.handle ? `/products/${product.handle}` : '/',
      commissionRate: 10,
      slug: finalSlug,
    },
    include: {
      organization: { select: { id: true, name: true, slug: true, logoUrl: true, shopDomain: true } },
      product: { select: { id: true, title: true, imageUrl: true, price: true, currency: true } },
      _count: { select: { clicks: true } },
      commissions: { select: { orderAmount: true, amount: true, status: true, createdAt: true } },
    },
  });

  const baseUrl = (customBaseUrl || getFrontendBaseUrl()).replace(/\/+$/, '');
  const shareUrl = `${baseUrl}/r/${link.slug}`;

  return {
    id: link.id,
    slug: link.slug,
    shareUrl,
    targetType: link.targetType,
    store: {
      id: link.organization.id,
      name: link.organization.name,
      slug: link.organization.slug,
      logoUrl: link.organization.logoUrl,
      shopDomain: link.organization.shopDomain,
    },
    product: link.product
      ? {
          id: link.product.id,
          title: link.product.title,
          imageUrl: link.product.imageUrl,
          price: link.product.price,
          currency: link.product.currency || 'INR',
        }
      : null,
    commissionRate: Number(link.commissionRate),
    status: link.status,
    clicks: 0,
    orders: 0,
    totalSales: 0,
    totalEarned: 0,
    conversionRate: 0,
    createdAt: link.createdAt,
  };
}

export async function getCustomerDashboard(app: FastifyInstance, userId: string, customBaseUrl?: string) {
  const user = await getOrCreateCustomerProfile(app.prisma, userId);
  const baseUrl = (customBaseUrl || getFrontendBaseUrl()).replace(/\/+$/, '');

  const [links, commissions, claims, totalClicksCount] = await Promise.all([
    app.prisma.affiliateLink.findMany({
      where: { creatorId: userId },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
        _count: { select: { clicks: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    app.prisma.affiliateCommission.findMany({
      where: { creatorId: userId },
      include: {
        organization: { select: { id: true, name: true } },
        shopifyOrder: { select: { id: true, name: true, email: true, currency: true, total: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    app.prisma.customerRewardClaim.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    app.prisma.affiliateLinkClick.count({
      where: { link: { creatorId: userId } },
    }),
  ]);

  const validCommissions = commissions.filter((c: any) => c.status !== 'REVERSED');
  const totalReferralOrders = validCommissions.length;
  const totalSalesAmount = validCommissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount), 0);
  const totalRewardsEarned = validCommissions
    .filter((c: any) => c.status === 'APPROVED' || c.status === 'PAID')
    .reduce((sum: number, c: any) => sum + Number(c.amount), 0);
  const pendingRewards = validCommissions
    .filter((c: any) => c.status === 'PENDING')
    .reduce((sum: number, c: any) => sum + Number(c.amount), 0);

  const conversionRate = totalClicksCount > 0 ? Math.round((totalReferralOrders / totalClicksCount) * 1000) / 10 : 0;
  const tierInfo = calculateTier(totalReferralOrders, totalRewardsEarned);

  // Primary link
  const primaryLink = links[0]
    ? {
        id: links[0].id,
        slug: links[0].slug,
        shareUrl: `${baseUrl}/r/${links[0].slug}`,
        storeName: links[0].organization.name,
      }
    : null;

  // Monthly performance chart for past 6 months
  const now = new Date();
  const monthlyData: { month: string; clicks: number; orders: number; rewards: number }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('en-US', { month: 'short' });
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    // Filter orders in this month
    const monthOrders = validCommissions.filter((c: any) => {
      const cd = new Date(c.createdAt);
      return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
    });
    
    const ordersCount = monthOrders.length;
    const rewardsSum = monthOrders.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
    // Estimated clicks distribution or proportional
    const clicksEst = Math.max(ordersCount * 4, Math.round(totalClicksCount / 6));

    monthlyData.push({
      month: monthName,
      clicks: clicksEst,
      orders: ordersCount,
      rewards: Math.round(rewardsSum * 100) / 100,
    });
  }

  // Recent activity stream
  const recentActivity = validCommissions.slice(0, 10).map((c: any) => ({
    id: c.id,
    type: 'ORDER_REFERRAL',
    storeName: c.organization.name,
    orderName: c.shopifyOrder?.name || 'Order',
    orderAmount: Number(c.orderAmount),
    rewardAmount: Number(c.amount),
    status: c.status,
    currency: c.shopifyOrder?.currency || 'INR',
    createdAt: c.createdAt,
  }));

  // Fetch store referral config
  const storeId = links[0]?.organizationId;
  let storeConfig = null;
  if (storeId) {
    storeConfig = await (app.prisma as any).storeReferralConfig.findUnique({
      where: { organizationId: storeId },
    });
  }
  if (!storeConfig) {
    storeConfig = await (app.prisma as any).storeReferralConfig.findFirst();
  }

  const referralConfig = {
    isEnabled: storeConfig?.isEnabled ?? true,
    rewardMode: storeConfig?.rewardMode ?? 'POINTS',
    commissionRate: Number(storeConfig?.commissionRate ?? 10),
    pointsPerCurrency: storeConfig?.pointsPerCurrency ?? 1,
    welcomeBonusPoints: storeConfig?.welcomeBonusPoints ?? 100,
    minPayoutAmount: Number(storeConfig?.minPayoutAmount ?? 500),
    friendDiscountEnabled: storeConfig?.friendDiscountEnabled ?? true,
    friendDiscountType: storeConfig?.friendDiscountType ?? 'PERCENTAGE',
    friendDiscountValue: Number(storeConfig?.friendDiscountValue ?? 10),
    showTierRoadmap: storeConfig?.showTierRoadmap ?? true,
    showPerformanceCharts: storeConfig?.showPerformanceCharts ?? true,
    showRewardsStore: storeConfig?.showRewardsStore ?? true,
    showRecentPurchases: storeConfig?.showRecentPurchases ?? true,
    programTitle: storeConfig?.programTitle ?? 'Customer Advocate & Referral Rewards',
    customShareMessage: storeConfig?.customShareMessage ?? 'Get 10% off with my link, and support me!',
    accentColor: storeConfig?.accentColor ?? '#6c5ce7',
  };

  // Fetch active store created offers for this store and all active partner stores
  const storeOffers = await (app.prisma as any).storeReferralOffer.findMany({
    where: {
      status: 'ACTIVE',
      ...(storeId ? { OR: [{ organizationId: storeId }, { isFeatured: true }] } : {}),
    },
    include: {
      organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
  });

  const availableOffers = storeOffers.map((o: any) => ({
    id: o.id,
    storeId: o.organizationId,
    storeName: o.organization?.name || links[0]?.organization?.name || 'Partner Store',
    title: o.title,
    description: o.description,
    rewardMode: o.rewardMode,
    advocateRewardRate: Number(o.advocateRewardRate),
    friendDiscountType: o.friendDiscountType,
    friendDiscountValue: Number(o.friendDiscountValue),
    status: o.status,
    isFeatured: o.isFeatured,
    badgeText: o.badgeText,
    bannerText: o.bannerText,
  }));

  return {
    summary: {
      totalClicks: totalClicksCount,
      totalReferralOrders,
      totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
      totalRewardsEarned: Math.round(totalRewardsEarned * 100) / 100,
      pendingRewards: Math.round(pendingRewards * 100) / 100,
      pointsBalance: user.customerProfile?.pointsBalance ?? 100,
      conversionRate,
      creatorCode: user.creatorCode,
      tier: tierInfo.tier,
      tierDetails: tierInfo,
      friendDiscountPercent: referralConfig.friendDiscountValue,
      rewardRatePercent: referralConfig.commissionRate,
      rewardMode: referralConfig.rewardMode,
    },
    referralConfig,
    availableOffers,
    primaryReferralLink: primaryLink,
    monthlyPerformance: monthlyData,
    recentActivity,
    recentClaims: claims,
  };
}

export async function getCustomerReferralsList(app: FastifyInstance, userId: string) {
  await getOrCreateCustomerProfile(app.prisma, userId);

  const commissions = await app.prisma.affiliateCommission.findMany({
    where: { creatorId: userId },
    include: {
      organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
      shopifyOrder: { select: { id: true, name: true, email: true, currency: true, total: true, processedAt: true, createdAt: true } },
      link: { select: { id: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return commissions.map((c: any) => {
    const maskedEmail = c.shopifyOrder?.email
      ? c.shopifyOrder.email.replace(/^(.)(.*)(@.*)$/, (_: any, a: string, b: string, c: string) => `${a}${'*'.repeat(Math.max(2, b.length))}${c}`)
      : 'Friend Purchase';

    return {
      id: c.id,
      orderId: c.shopifyOrderId,
      orderName: c.shopifyOrder?.name || 'Order',
      customerMasked: maskedEmail,
      storeName: c.organization.name,
      orderAmount: Number(c.orderAmount),
      commissionRate: Number(c.commissionRate),
      rewardAmount: Number(c.amount),
      currency: c.shopifyOrder?.currency || 'INR',
      status: c.status,
      linkSlug: c.link?.slug ?? null,
      date: c.shopifyOrder?.processedAt || c.createdAt,
    };
  });
}

export async function getCustomerRewardsCatalog(app: FastifyInstance, userId: string) {
  const user = await getOrCreateCustomerProfile(app.prisma, userId);
  const points = user.customerProfile?.pointsBalance ?? 100;

  // 1. Fetch active rewards created by stores
  const storeItems = await (app.prisma as any).storeRewardItem.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ pointsCost: 'asc' }],
  });

  let catalog: any[] = [];
  if (storeItems && storeItems.length > 0) {
    catalog = storeItems.map((item: any) => ({
      id: item.id,
      storeId: item.organizationId,
      title: item.title,
      description: item.description || 'Exclusive advocate reward voucher.',
      type: item.type,
      pointsCost: item.pointsCost,
      value: Number(item.rewardValue),
      badge: item.badge || (item.type === 'DISCOUNT_CODE' ? 'DISCOUNT' : item.type === 'PRODUCT_LINK' ? 'PRODUCT GIFT' : item.type === 'CASH_PAYOUT' ? 'CASH' : 'VIP'),
      icon: item.icon || (item.type === 'PRODUCT_LINK' ? 'ShoppingBag' : 'Gift'),
      couponCode: item.couponCode || null,
      productName: item.productName || null,
      productLink: item.productLink || null,
      codeTemplate: item.codeTemplate || null,
      available: points >= item.pointsCost,
    }));
  } else {
    // Fallback baseline rewards catalog
    catalog = [
      {
        id: 'rew_disc_10',
        title: '10% Off Store Coupon',
        description: 'Get an instant 10% discount promo voucher for your next order.',
        type: 'DISCOUNT_CODE',
        pointsCost: 100,
        value: 10,
        badge: 'POPULAR',
        icon: 'Tag',
        couponCode: 'SAVE10VIP',
        productName: null,
        productLink: null,
        available: points >= 100,
      },
      {
        id: 'rew_product_free_gift',
        title: 'Free Best-Seller Mystery Product',
        description: 'Unlock 100% free claim link for a top-rated skincare gift product.',
        type: 'PRODUCT_LINK',
        pointsCost: 350,
        value: 750,
        badge: 'FREE GIFT',
        icon: 'ShoppingBag',
        couponCode: 'FREEGIFT-VIP',
        productName: 'Signature Glow Face Elixir (50ml)',
        productLink: 'https://store.example.com/products/glow-elixir',
        available: points >= 350,
      },
      {
        id: 'rew_store_cred_500',
        title: '₹500 Store Gift Card',
        description: 'Redeem points for ₹500 instant store shopping credit.',
        type: 'GIFT_CARD',
        pointsCost: 500,
        value: 500,
        badge: 'HOT',
        icon: 'Gift',
        couponCode: 'GIFT500-VIP',
        productName: null,
        productLink: null,
        available: points >= 500,
      },
      {
        id: 'rew_store_cred_1000',
        title: '₹1,000 Store Gift Card',
        description: 'Redeem points for ₹1,000 instant store shopping credit.',
        type: 'GIFT_CARD',
        pointsCost: 1000,
        value: 1000,
        badge: 'VIP',
        icon: 'CreditCard',
        couponCode: 'GIFT1000-VIP',
        productName: null,
        productLink: null,
        available: points >= 1000,
      },
      {
        id: 'rew_cash_payout_2000',
        title: '₹2,000 Direct Cash Transfer',
        description: 'Transfer cash rewards directly to your UPI ID or Bank Account.',
        type: 'CASH_PAYOUT',
        pointsCost: 2000,
        value: 2000,
        badge: 'CASH',
        icon: 'Wallet',
        couponCode: null,
        productName: null,
        productLink: null,
        available: points >= 2000,
      },
      {
        id: 'rew_vip_box',
        title: 'Exclusive VIP Mystery Box',
        description: 'Handpicked best-seller products delivered straight to your doorstep.',
        type: 'PRODUCT_LINK',
        pointsCost: 3500,
        value: 3500,
        badge: 'DIAMOND',
        icon: 'Sparkles',
        couponCode: 'VIPBOX-100FREE',
        productName: 'MegaInfluencer VIP Gold Hamper (4 Full-Size Items)',
        productLink: 'https://store.example.com/products/vip-mystery-box',
        available: points >= 3500,
      },
    ];
  }

  const claims = await app.prisma.customerRewardClaim.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return {
    pointsBalance: points,
    catalog,
    claims: claims.map((claim: any) => ({
      id: claim.id,
      rewardTitle: claim.rewardTitle,
      rewardType: claim.rewardType,
      rewardValue: Number(claim.rewardValue),
      pointsCost: claim.pointsCost,
      code: claim.code,
      status: claim.status,
      details: claim.details,
      createdAt: claim.createdAt,
    })),
  };
}

export async function claimCustomerReward(
  app: FastifyInstance,
  userId: string,
  input: {
    rewardId?: string | null;
    rewardType: 'DISCOUNT_CODE' | 'PRODUCT_LINK' | 'CASH_PAYOUT' | 'GIFT_CARD' | 'STORE_CREDIT' | string;
    storeId?: string | null;
    pointsCost: number;
    rewardValue: number;
    rewardTitle: string;
    couponCode?: string | null;
    productName?: string | null;
    productLink?: string | null;
    payoutAccount?: string | null;
  },
) {
  const user = await getOrCreateCustomerProfile(app.prisma, userId);
  const currentPoints = user.customerProfile?.pointsBalance ?? 0;

  if (currentPoints < input.pointsCost) {
    throw new AppError('INSUFFICIENT_POINTS', `You need ${input.pointsCost} points to claim this reward (you have ${currentPoints}).`, 400);
  }

  // Lookup store reward item if provided
  let storeItem: any = null;
  if (input.rewardId) {
    storeItem = await (app.prisma as any).storeRewardItem.findUnique({
      where: { id: input.rewardId },
    });
  }

  const assignedCoupon = storeItem?.couponCode || input.couponCode;
  const assignedProduct = storeItem?.productName || input.productName;
  const assignedLink = storeItem?.productLink || input.productLink;

  // Generate or assign unique coupon voucher code
  const code = assignedCoupon
    ? assignedCoupon
    : input.rewardType === 'DISCOUNT_CODE' || input.rewardType === 'GIFT_CARD' || input.rewardType === 'PRODUCT_LINK'
    ? `VIP-${user.creatorCode || 'REF'}-${randomBytes(3).toString('hex').toUpperCase()}`
    : null;

  const [claim, updatedProfile] = await app.prisma.$transaction([
    app.prisma.customerRewardClaim.create({
      data: {
        userId,
        organizationId: input.storeId || storeItem?.organizationId || null,
        rewardTitle: input.rewardTitle,
        rewardType: input.rewardType,
        rewardValue: input.rewardValue,
        pointsCost: input.pointsCost,
        code,
        status: input.rewardType === 'CASH_PAYOUT' ? 'PENDING' : 'COMPLETED',
        details: {
          payoutAccount: input.payoutAccount || null,
          couponCode: code,
          productName: assignedProduct || null,
          productLink: assignedLink || null,
          claimedAt: new Date().toISOString(),
        },
      },
    }),
    app.prisma.customerProfile.update({
      where: { userId },
      data: {
        pointsBalance: { decrement: input.pointsCost },
      },
    }),
  ]);

  return {
    claim: {
      id: claim.id,
      rewardTitle: claim.rewardTitle,
      rewardType: claim.rewardType,
      rewardValue: Number(claim.rewardValue),
      pointsCost: claim.pointsCost,
      code: claim.code,
      status: claim.status,
      details: claim.details,
      createdAt: claim.createdAt,
    },
    unlockedData: {
      couponCode: code,
      productName: assignedProduct || null,
      productLink: assignedLink || null,
      rewardType: claim.rewardType,
      rewardTitle: claim.rewardTitle,
      rewardValue: Number(claim.rewardValue),
    },
    newPointsBalance: updatedProfile.pointsBalance,
  };
}

export async function getCustomerLeaderboard(
  app: FastifyInstance,
  userId: string,
  timeframe: 'THIS_MONTH' | 'ALL_TIME' = 'THIS_MONTH'
) {
  await getOrCreateCustomerProfile(app.prisma, userId);

  // Timeframe filter for orders
  const whereClause: any = {
    creatorId: { not: null },
    status: { in: ['APPROVED', 'PAID', 'PENDING'] },
  };

  if (timeframe === 'THIS_MONTH') {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    whereClause.createdAt = { gte: startOfMonth };
  }

  // Fetch all commissions in the timeframe
  const commissions = await app.prisma.affiliateCommission.findMany({
    where: whereClause,
    include: {
      creator: {
        select: {
          id: true,
          displayName: true,
          email: true,
          creatorCode: true,
          customerProfile: true,
        },
      },
    },
  });

  // Group by creator
  const advocateMap = new Map<string, any>();
  for (const c of commissions) {
    if (!c.creator) continue;
    const cid = c.creator.id;
    if (!advocateMap.has(cid)) {
      const nameParts = (c.creator.displayName || 'Customer Advocate').split(' ');
      const maskedName = nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[1][0]}.`
        : nameParts[0];

      advocateMap.set(cid, {
        id: cid,
        name: maskedName,
        fullName: c.creator.displayName || 'Customer Advocate',
        email: c.creator.email,
        creatorCode: c.creator.creatorCode || 'REF',
        tier: c.creator.customerProfile?.tier || 'BRONZE',
        pointsBalance: c.creator.customerProfile?.pointsBalance || 0,
        avatarUrl: c.creator.customerProfile?.avatarUrl || null,
        totalReferrals: 0,
        totalSales: 0,
        totalEarned: 0,
        isCurrentUser: cid === userId,
      });
    }

    const item = advocateMap.get(cid);
    item.totalReferrals += 1;
    item.totalSales += Number(c.orderAmount);
    item.totalEarned += Number(c.amount);
  }

  // Ensure current user is in list even if 0 orders
  if (!advocateMap.has(userId)) {
    const me = await app.prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true },
    });
    if (me) {
      advocateMap.set(userId, {
        id: userId,
        name: me.displayName || 'You',
        fullName: me.displayName || 'You',
        email: me.email,
        creatorCode: me.creatorCode || 'REF',
        tier: me.customerProfile?.tier || 'BRONZE',
        pointsBalance: me.customerProfile?.pointsBalance || 0,
        avatarUrl: me.customerProfile?.avatarUrl || null,
        totalReferrals: 0,
        totalSales: 0,
        totalEarned: 0,
        isCurrentUser: true,
      });
    }
  }

  // Convert to array and sort by totalSales desc, then totalReferrals desc
  const sorted = Array.from(advocateMap.values()).sort((a, b) => {
    if (b.totalSales !== a.totalSales) return b.totalSales - a.totalSales;
    return b.totalReferrals - a.totalReferrals;
  });

  // Assign ranks & reward badges
  const leaderboard = sorted.map((adv, index) => {
    const rank = index + 1;
    let badge = null;
    let prize = null;

    if (rank === 1) {
      badge = '👑 1st Place Champion';
      prize = '+₹2,500 Monthly Bonus Perk';
    } else if (rank === 2) {
      badge = '🥈 2nd Place Runner-up';
      prize = '+₹1,000 Monthly Bonus Perk';
    } else if (rank === 3) {
      badge = '🥉 3rd Place Star';
      prize = '+₹500 Monthly Bonus Perk';
    } else if (rank <= 10) {
      badge = '⭐ Top 10 Elite';
      prize = '+250 Bonus Pts';
    }

    return {
      rank,
      ...adv,
      totalSales: Math.round(adv.totalSales * 100) / 100,
      totalEarned: Math.round(adv.totalEarned * 100) / 100,
      badge,
      prize,
    };
  });

  const currentUserItem = leaderboard.find((item) => item.isCurrentUser);
  const currentUserRank = currentUserItem ? currentUserItem.rank : null;

  // Next rank target gap calculation
  let gapToNextRank = null;
  if (currentUserItem && currentUserItem.rank > 1) {
    const nextRankItem = leaderboard[currentUserItem.rank - 2];
    gapToNextRank = {
      targetRank: currentUserItem.rank - 1,
      targetName: nextRankItem.name,
      salesGap: Math.max(0, Math.round((nextRankItem.totalSales - currentUserItem.totalSales) * 100) / 100),
      ordersGap: Math.max(1, nextRankItem.totalReferrals - currentUserItem.totalReferrals + 1),
    };
  }

  return {
    timeframe,
    leaderboard,
    podium: leaderboard.slice(0, 3),
    currentUser: currentUserItem,
    currentUserRank,
    gapToNextRank,
    totalParticipants: leaderboard.length,
  };
}

export async function getCustomerMilestones(app: FastifyInstance, userId: string) {
  const user = await getOrCreateCustomerProfile(app.prisma, userId);

  // 1. Get advocate stats
  const commissions = await app.prisma.affiliateCommission.findMany({
    where: {
      creatorId: userId,
      status: { in: ['APPROVED', 'PAID', 'PENDING'] },
    },
    select: { orderAmount: true, amount: true },
  });

  const totalReferralCount = commissions.length;
  const totalSalesAmount = commissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount), 0);

  // 2. Fetch active milestones from DB
  let milestones = await (app.prisma as any).storeReferralMilestone.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ targetType: 'asc' }, { targetValue: 'asc' }],
  });

  // If 0 exist in DB, auto-seed standard milestones
  if (milestones.length === 0) {
    const firstStore = await app.prisma.organization.findFirst({ where: { status: 'ACTIVE' } });
    if (firstStore) {
      const defaultMilestones = [
        {
          organizationId: firstStore.id,
          title: 'First Referral Win',
          description: 'Get your very first referred friend purchase on the store.',
          targetType: 'REFERRAL_COUNT',
          targetValue: 1,
          rewardType: 'POINTS',
          pointsBonus: 100,
          rewardValue: 100,
          badgeText: 'STARTER',
          icon: 'Sparkles',
          status: 'ACTIVE',
        },
        {
          organizationId: firstStore.id,
          title: '5 Friends Referred',
          description: 'Successfully refer 5 shopping friends to unlock bonus points.',
          targetType: 'REFERRAL_COUNT',
          targetValue: 5,
          rewardType: 'POINTS',
          pointsBonus: 500,
          rewardValue: 500,
          badgeText: 'BRONZE MILESTONE',
          icon: 'Users',
          status: 'ACTIVE',
        },
        {
          organizationId: firstStore.id,
          title: '15 Referral Super Advocate',
          description: 'Reach 15 completed referral orders and unlock huge reward perks.',
          targetType: 'REFERRAL_COUNT',
          targetValue: 15,
          rewardType: 'GIFT_CARD',
          pointsBonus: 1500,
          rewardValue: 1500,
          badgeText: 'SILVER CHAMPION',
          icon: 'Award',
          status: 'ACTIVE',
        },
        {
          organizationId: firstStore.id,
          title: '30 Referral Legend',
          description: 'Elite milestone: 30 referral orders with VIP status & mystery hamper.',
          targetType: 'PRODUCT_GIFT',
          pointsBonus: 3500,
          rewardValue: 3500,
          badgeText: 'GOLD LEGEND',
          icon: 'Trophy',
          status: 'ACTIVE',
        },
        {
          organizationId: firstStore.id,
          title: '₹25,000 Sales Volume Milestone',
          description: 'Generate ₹25,000 in attributed shopping volume for partner stores.',
          targetType: 'SALES_AMOUNT',
          targetValue: 25000,
          rewardType: 'CASH_PAYOUT',
          pointsBonus: 2500,
          rewardValue: 2500,
          badgeText: 'HIGH ROLLER',
          icon: 'DollarSign',
          status: 'ACTIVE',
        },
        {
          organizationId: firstStore.id,
          title: '₹1,00,000 Diamond Club',
          description: 'Top-tier milestone: generate ₹1,00,000 in word-of-mouth sales.',
          targetType: 'SALES_AMOUNT',
          targetValue: 100000,
          rewardType: 'CASH_PAYOUT',
          pointsBonus: 10000,
          rewardValue: 10000,
          badgeText: 'DIAMOND CLUB',
          icon: 'Crown',
          status: 'ACTIVE',
        },
      ];

      for (const m of defaultMilestones) {
        await (app.prisma as any).storeReferralMilestone.create({ data: m });
      }

      milestones = await (app.prisma as any).storeReferralMilestone.findMany({
        where: { status: 'ACTIVE' },
        orderBy: [{ targetType: 'asc' }, { targetValue: 'asc' }],
      });
    }
  }

  // 3. Fetch user's claimed milestones
  const claims = await (app.prisma as any).customerMilestoneClaim.findMany({
    where: { userId },
  });
  const claimedMap = new Set(claims.map((c: any) => c.milestoneId));

  const formattedMilestones = milestones.map((m: any) => {
    const isCount = m.targetType === 'REFERRAL_COUNT';
    const currentProgress = isCount ? totalReferralCount : totalSalesAmount;
    const targetValue = Number(m.targetValue);
    const progressPercent = Math.min(100, Math.round((currentProgress / targetValue) * 100));
    const isUnlocked = currentProgress >= targetValue;
    const isClaimed = claimedMap.has(m.id);
    const canClaim = isUnlocked && !isClaimed;

    return {
      id: m.id,
      title: m.title,
      description: m.description,
      targetType: m.targetType,
      targetValue,
      currentProgress: Math.round(currentProgress * 100) / 100,
      progressPercent,
      rewardType: m.rewardType,
      pointsBonus: m.pointsBonus,
      rewardValue: Number(m.rewardValue),
      badgeText: m.badgeText,
      icon: m.icon,
      isUnlocked,
      isClaimed,
      canClaim,
    };
  });

  const totalClaimedPoints = claims.reduce((sum: number, c: any) => sum + (c.pointsAwarded || 0), 0);
  const completedCount = formattedMilestones.filter((m: any) => m.isUnlocked).length;

  return {
    stats: {
      totalReferralCount,
      totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
      pointsBalance: user.customerProfile?.pointsBalance || 100,
    },
    milestones: formattedMilestones,
    totalClaimedPoints,
    completedCount,
    totalCount: formattedMilestones.length,
  };
}

export async function claimCustomerMilestone(
  app: FastifyInstance,
  userId: string,
  milestoneId: string
) {
  const user = await getOrCreateCustomerProfile(app.prisma, userId);

  const milestone = await (app.prisma as any).storeReferralMilestone.findUnique({
    where: { id: milestoneId },
  });

  if (!milestone || milestone.status !== 'ACTIVE') {
    throw new AppError('MILESTONE_NOT_FOUND', 'Milestone not found or inactive.', 404);
  }

  // Check if already claimed
  const existingClaim = await (app.prisma as any).customerMilestoneClaim.findUnique({
    where: {
      userId_milestoneId: {
        userId,
        milestoneId,
      },
    },
  });

  if (existingClaim) {
    throw new AppError('ALREADY_CLAIMED', 'You have already claimed this milestone reward.', 400);
  }

  // Verify qualification
  const commissions = await app.prisma.affiliateCommission.findMany({
    where: {
      creatorId: userId,
      status: { in: ['APPROVED', 'PAID', 'PENDING'] },
    },
    select: { orderAmount: true },
  });

  const totalReferralCount = commissions.length;
  const totalSalesAmount = commissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount), 0);
  const currentProgress = milestone.targetType === 'REFERRAL_COUNT' ? totalReferralCount : totalSalesAmount;

  if (currentProgress < Number(milestone.targetValue)) {
    throw new AppError(
      'MILESTONE_NOT_REACHED',
      `Target not reached. You have ${currentProgress} / ${milestone.targetValue}.`,
      400
    );
  }

  // Award points & create claim record in transaction
  const [claim, updatedProfile] = await app.prisma.$transaction([
    (app.prisma as any).customerMilestoneClaim.create({
      data: {
        userId,
        milestoneId,
        pointsAwarded: milestone.pointsBonus,
        rewardValue: milestone.rewardValue,
      },
    }),
    app.prisma.customerProfile.update({
      where: { userId },
      data: {
        pointsBalance: { increment: milestone.pointsBonus },
      },
    }),
  ]);

  return {
    ok: true,
    claim: {
      id: claim.id,
      milestoneId: claim.milestoneId,
      pointsAwarded: claim.pointsAwarded,
      rewardValue: Number(claim.rewardValue),
      claimedAt: claim.claimedAt,
    },
    pointsBonus: milestone.pointsBonus,
    newPointsBalance: updatedProfile.pointsBalance,
    milestoneTitle: milestone.title,
  };
}

