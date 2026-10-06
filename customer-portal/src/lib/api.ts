export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'CUSTOMER' | 'INFLUENCER' | 'STORE_OWNER' | 'ADMIN';
  status: string;
}

export interface CustomerProfile {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  creatorCode: string;
  phone: string | null;
  avatarUrl: string | null;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  tierDetails: {
    tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    nextTier: string | null;
    progress: number;
    perks: string[];
  };
  pointsBalance: number;
  totalEarned: number;
  totalRewardsEarned?: number;
  pendingRewards: number;
  payoutMethod: 'UPI' | 'PAYPAL' | 'BANK' | 'STORE_CREDIT' | null;
  payoutDetails: any;
  createdAt: string;
}

export interface ReferralConfig {
  isEnabled: boolean;
  rewardMode: 'POINTS' | 'CASHBACK_COMMISSION' | 'DISCOUNT_ONLY' | 'HYBRID';
  commissionRate: number;
  pointsPerCurrency: number;
  welcomeBonusPoints: number;
  minPayoutAmount: number;
  friendDiscountEnabled: boolean;
  friendDiscountType: string;
  friendDiscountValue: number;
  showTierRoadmap: boolean;
  showPerformanceCharts: boolean;
  showRewardsStore: boolean;
  showRecentPurchases: boolean;
  programTitle: string | null;
  customShareMessage: string | null;
  accentColor: string | null;
}

export interface CustomerReferralOffer {
  id: string;
  storeId: string;
  storeName: string;
  title: string;
  description: string | null;
  rewardMode: 'POINTS' | 'CASHBACK_COMMISSION' | 'DISCOUNT_ONLY' | 'HYBRID';
  advocateRewardRate: number;
  friendDiscountType: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  friendDiscountValue: number;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  isFeatured?: boolean;
  badgeText?: string | null;
  bannerText?: string | null;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  category: string;
  shopDomain: string | null;
  productCount: number;
  rewardRatePercent: number;
  friendDiscountPercent: number;
  hasActiveLink: boolean;
  activeLinkSlug: string | null;
}

export interface ReferralLink {
  id: string;
  slug: string;
  shareUrl: string;
  targetType: 'STORE' | 'PRODUCT' | 'COLLECTION';
  store: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    shopDomain: string | null;
  };
  product: {
    id: string;
    title: string;
    imageUrl: string | null;
    price: string | null;
    currency: string;
  } | null;
  commissionRate: number;
  status: string;
  clicks: number;
  orders: number;
  totalSales: number;
  totalEarned: number;
  conversionRate: number;
  createdAt: string;
}

export interface DashboardData {
  summary: {
    totalClicks: number;
    totalReferralOrders: number;
    totalSalesAmount: number;
    totalRewardsEarned: number;
    pendingRewards: number;
    pointsBalance: number;
    conversionRate: number;
    creatorCode: string;
    tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    tierDetails: {
      tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
      nextTier: string | null;
      progress: number;
      perks: string[];
    };
    friendDiscountPercent: number;
    rewardRatePercent: number;
    rewardMode?: 'POINTS' | 'CASHBACK_COMMISSION' | 'DISCOUNT_ONLY' | 'HYBRID';
  };
  referralConfig?: ReferralConfig;
  availableOffers?: CustomerReferralOffer[];
  primaryReferralLink: {
    id: string;
    slug: string;
    shareUrl: string;
    storeName: string;
  } | null;
  monthlyPerformance: {
    month: string;
    clicks: number;
    orders: number;
    rewards: number;
  }[];
  recentActivity: {
    id: string;
    type: string;
    storeName: string;
    orderName: string;
    orderAmount: number;
    rewardAmount: number;
    status: string;
    currency: string;
    createdAt: string;
  }[];
  recentClaims: {
    id: string;
    rewardTitle: string;
    rewardType: string;
    rewardValue: number;
    pointsCost: number;
    code: string | null;
    status: string;
    details: any;
    createdAt: string;
  }[];
}

export interface ReferralTransaction {
  id: string;
  orderId: string;
  orderName: string;
  customerMasked: string;
  storeName: string;
  orderAmount: number;
  commissionRate: number;
  rewardAmount: number;
  currency: string;
  status: string;
  linkSlug: string | null;
  date: string;
}

export interface RewardItem {
  id: string;
  storeId?: string | null;
  title: string;
  description: string;
  type: 'DISCOUNT_CODE' | 'PRODUCT_LINK' | 'CASH_PAYOUT' | 'GIFT_CARD' | 'STORE_CREDIT' | 'PRODUCT_GIFT' | string;
  pointsCost: number;
  value: number;
  badge: string;
  icon: string;
  couponCode?: string | null;
  productName?: string | null;
  productLink?: string | null;
  available: boolean;
}

export interface RewardClaim {
  id: string;
  rewardTitle: string;
  rewardType: string;
  rewardValue: number;
  pointsCost: number;
  code: string | null;
  status: string;
  details: {
    couponCode?: string | null;
    productName?: string | null;
    productLink?: string | null;
    payoutAccount?: string | null;
    claimedAt?: string;
    [key: string]: any;
  } | null;
  createdAt: string;
}

export interface LeaderboardAdvocate {
  rank: number;
  id: string;
  name: string;
  fullName: string;
  email: string;
  creatorCode: string;
  tier: string;
  pointsBalance: number;
  avatarUrl: string | null;
  totalReferrals: number;
  totalSales: number;
  totalEarned: number;
  isCurrentUser: boolean;
  badge: string | null;
  prize: string | null;
}

export interface LeaderboardResponse {
  timeframe: 'THIS_MONTH' | 'ALL_TIME';
  leaderboard: LeaderboardAdvocate[];
  podium: LeaderboardAdvocate[];
  currentUser: LeaderboardAdvocate | null;
  currentUserRank: number | null;
  gapToNextRank: {
    targetRank: number;
    targetName: string;
    salesGap: number;
    ordersGap: number;
  } | null;
  totalParticipants: number;
}

export interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  targetType: 'REFERRAL_COUNT' | 'SALES_AMOUNT';
  targetValue: number;
  currentProgress: number;
  progressPercent: number;
  rewardType: 'POINTS' | 'DISCOUNT_CODE' | 'CASH_PAYOUT' | 'GIFT_CARD' | 'PRODUCT_GIFT';
  pointsBonus: number;
  rewardValue: number;
  badgeText: string | null;
  icon: string | null;
  isUnlocked: boolean;
  isClaimed: boolean;
  canClaim: boolean;
}

export interface MilestonesResponse {
  stats: {
    totalReferralCount: number;
    totalSalesAmount: number;
    pointsBalance: number;
  };
  milestones: MilestoneItem[];
  totalClaimedPoints: number;
  completedCount: number;
  totalCount: number;
}

const API_BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('advocate_token');
}

export function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem('advocate_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('advocate_refresh_token', refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem('advocate_token');
  localStorage.removeItem('advocate_refresh_token');
  localStorage.removeItem('advocate_user');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized, clear tokens
    clearTokens();
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || data.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  auth: {
    async register(payload: { email: string; password: string; displayName: string; phone?: string }) {
      return request<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...payload, role: 'CUSTOMER' }),
      });
    },

    async login(payload: { email: string; password: string }) {
      const data = await request<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('advocate_user', JSON.stringify(data.user));
      return data;
    },

    async getMe() {
      return request<{ user: User }>('/me');
    },

    logout() {
      clearTokens();
    },
  },

  customer: {
    async getProfile() {
      return request<CustomerProfile>('/customer/profile');
    },

    async updateProfile(payload: { displayName?: string; phone?: string | null; avatarUrl?: string | null; payoutMethod?: string | null; payoutDetails?: any }) {
      return request<CustomerProfile>('/customer/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },

    async getStores() {
      return request<{ stores: Store[] }>('/customer/stores');
    },

    async getReferralLinks() {
      return request<{ links: ReferralLink[] }>('/customer/referral-links');
    },

    async createReferralLink(payload: { storeId: string; productId?: string | null; customSlug?: string | null }) {
      return request<{ link: ReferralLink }>('/customer/referral-links', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async getDashboard() {
      return request<DashboardData>('/customer/dashboard');
    },

    async getReferrals() {
      return request<{ referrals: ReferralTransaction[] }>('/customer/referrals');
    },

    async getRewards() {
      return request<{ pointsBalance: number; catalog: RewardItem[]; claims: RewardClaim[] }>('/customer/rewards');
    },

    async claimReward(payload: {
      rewardId?: string | null;
      rewardType: 'DISCOUNT_CODE' | 'PRODUCT_LINK' | 'CASH_PAYOUT' | 'GIFT_CARD' | 'STORE_CREDIT' | string;
      pointsCost: number;
      rewardValue: number;
      rewardTitle: string;
      couponCode?: string | null;
      productName?: string | null;
      productLink?: string | null;
      payoutAccount?: string | null;
      storeId?: string | null;
    }) {
      return request<{
        claim: RewardClaim;
        unlockedData?: {
          couponCode: string | null;
          productName: string | null;
          productLink: string | null;
          rewardType: string;
          rewardTitle: string;
          rewardValue: number;
        };
        newPointsBalance: number;
      }>('/customer/rewards/claim', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async getLeaderboard(timeframe: 'THIS_MONTH' | 'ALL_TIME' = 'THIS_MONTH') {
      return request<LeaderboardResponse>(`/customer/leaderboard?timeframe=${timeframe}`);
    },

    async getMilestones() {
      return request<MilestonesResponse>('/customer/milestones');
    },

    async claimMilestone(milestoneId: string) {
      return request<{
        ok: boolean;
        claim: any;
        pointsBonus: number;
        newPointsBalance: number;
        milestoneTitle: string;
      }>(`/customer/milestones/${milestoneId}/claim`, {
        method: 'POST',
      });
    },
  },
};
