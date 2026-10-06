import { apiClient } from "@/lib/api/client";
import { type StoreReferralConfig } from "./referral-settings.api";

export interface CustomerAdvocate {
  id: string;
  name: string;
  email: string;
  creatorCode: string;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  pointsBalance: number;
  totalEarned: number;
  phone: string | null;
  clicks: number;
  orders: number;
  sales: number;
  linkSlug: string | null;
  joinedAt: string;
  status: string;
}

export interface CustomerReferralOrder {
  id: string;
  orderId: string;
  orderName: string;
  customerMasked: string;
  customerEmail: string;
  advocateId?: string;
  advocateName: string;
  advocateCode: string;
  advocateEmail: string;
  orderAmount: number;
  commissionRate: number;
  rewardAmount: number;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  date: string;
}

export interface CustomerClaim {
  id: string;
  advocateId?: string;
  advocateName: string;
  advocateEmail: string;
  advocateCode: string;
  rewardTitle: string;
  rewardType: string;
  rewardValue: number;
  pointsCost: number;
  code: string | null;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  details?: any;
  createdAt: string;
}

export interface CustomerReferralOffer {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  rewardMode: "POINTS" | "CASHBACK_COMMISSION" | "DISCOUNT_ONLY" | "HYBRID";
  advocateRewardRate: number;
  friendDiscountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  friendDiscountValue: number;
  status: "ACTIVE" | "PAUSED" | "EXPIRED";
  isFeatured: boolean;
  badgeText: string | null;
  bannerText: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  usageCount: number;
  totalSales: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreRewardItem {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  type: "DISCOUNT_CODE" | "PRODUCT_LINK" | "GIFT_CARD" | "STORE_CREDIT" | "CASH_PAYOUT" | "PRODUCT_GIFT";
  pointsCost: number;
  rewardValue: number;
  category: string;
  badge: string | null;
  icon: string | null;
  couponCode: string | null;
  productName: string | null;
  productLink: string | null;
  codeTemplate: string | null;
  stockQuantity: number | null;
  status: "ACTIVE" | "PAUSED" | "OUT_OF_STOCK";
  minTier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerReferralsOverview {
  store: { id: string; name: string; slug: string };
  config: StoreReferralConfig;
  metrics: {
    totalAdvocates: number;
    totalSales: number;
    totalOrders: number;
    totalClicks: number;
    conversionRate: number;
    pendingOrdersCount: number;
    pendingPayoutsCount: number;
    totalPaidRewards: number;
  };
  topAdvocates: CustomerAdvocate[];
  recentOrders: CustomerReferralOrder[];
}

export interface StoreReferralMilestone {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  targetType: "REFERRAL_COUNT" | "SALES_AMOUNT";
  targetValue: number;
  rewardType: "POINTS" | "DISCOUNT_CODE" | "CASH_PAYOUT" | "GIFT_CARD" | "PRODUCT_GIFT";
  pointsBonus: number;
  rewardValue: number;
  badgeText: string | null;
  icon: string | null;
  status: "ACTIVE" | "PAUSED";
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLeaderboardItem {
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
  badge: string | null;
  prize: string | null;
}

export const customerReferralsApi = {
  getOverview: async (): Promise<CustomerReferralsOverview> => {
    const res = await apiClient.get<CustomerReferralsOverview>("/store/customer-referrals/overview");
    return res.data;
  },

  getAdvocates: async (): Promise<{ advocates: CustomerAdvocate[] }> => {
    const res = await apiClient.get<{ advocates: CustomerAdvocate[] }>("/store/customer-referrals/advocates");
    return res.data;
  },

  getOrders: async (status?: string): Promise<{ orders: CustomerReferralOrder[] }> => {
    const res = await apiClient.get<{ orders: CustomerReferralOrder[] }>("/store/customer-referrals/orders", {
      params: status && status !== "ALL" ? { status } : undefined,
    });
    return res.data;
  },

  updateOrderStatus: async (id: string, status: "APPROVED" | "REJECTED" | "PAID" | "PENDING"): Promise<{ ok: boolean }> => {
    const res = await apiClient.patch<{ ok: boolean }>(`/store/customer-referrals/orders/${id}/status`, { status });
    return res.data;
  },

  getClaims: async (): Promise<{ claims: CustomerClaim[] }> => {
    const res = await apiClient.get<{ claims: CustomerClaim[] }>("/store/customer-referrals/claims");
    return res.data;
  },

  updateClaimStatus: async (id: string, status: "COMPLETED" | "REJECTED" | "PENDING"): Promise<{ ok: boolean }> => {
    const res = await apiClient.patch<{ ok: boolean }>(`/store/customer-referrals/claims/${id}/status`, { status });
    return res.data;
  },

  getOffers: async (): Promise<{ offers: CustomerReferralOffer[] }> => {
    const res = await apiClient.get<{ offers: CustomerReferralOffer[] }>("/store/customer-referrals/offers");
    return res.data;
  },

  createOffer: async (data: Partial<CustomerReferralOffer>): Promise<{ ok: boolean; offer: CustomerReferralOffer }> => {
    const res = await apiClient.post<{ ok: boolean; offer: CustomerReferralOffer }>("/store/customer-referrals/offers", data);
    return res.data;
  },

  updateOffer: async (id: string, data: Partial<CustomerReferralOffer>): Promise<{ ok: boolean; offer: CustomerReferralOffer }> => {
    const res = await apiClient.patch<{ ok: boolean; offer: CustomerReferralOffer }>(`/store/customer-referrals/offers/${id}`, data);
    return res.data;
  },

  deleteOffer: async (id: string): Promise<{ ok: boolean; deleted: boolean }> => {
    const res = await apiClient.delete<{ ok: boolean; deleted: boolean }>(`/store/customer-referrals/offers/${id}`);
    return res.data;
  },

  getRewards: async (): Promise<{ rewards: StoreRewardItem[] }> => {
    const res = await apiClient.get<{ rewards: StoreRewardItem[] }>("/store/customer-referrals/rewards");
    return res.data;
  },

  createReward: async (data: Partial<StoreRewardItem>): Promise<{ ok: boolean; reward: StoreRewardItem }> => {
    const res = await apiClient.post<{ ok: boolean; reward: StoreRewardItem }>("/store/customer-referrals/rewards", data);
    return res.data;
  },

  updateReward: async (id: string, data: Partial<StoreRewardItem>): Promise<{ ok: boolean; reward: StoreRewardItem }> => {
    const res = await apiClient.patch<{ ok: boolean; reward: StoreRewardItem }>(`/store/customer-referrals/rewards/${id}`, data);
    return res.data;
  },

  deleteReward: async (id: string): Promise<{ ok: boolean; deleted: boolean }> => {
    const res = await apiClient.delete<{ ok: boolean; deleted: boolean }>(`/store/customer-referrals/rewards/${id}`);
    return res.data;
  },

  getLeaderboard: async (timeframe: 'THIS_MONTH' | 'ALL_TIME' = 'THIS_MONTH'): Promise<{ timeframe: string; leaderboard: CustomerLeaderboardItem[]; podium: CustomerLeaderboardItem[] }> => {
    const res = await apiClient.get<{ timeframe: string; leaderboard: CustomerLeaderboardItem[]; podium: CustomerLeaderboardItem[] }>("/store/customer-referrals/leaderboard", {
      params: { timeframe },
    });
    return res.data;
  },

  getMilestones: async (): Promise<{ milestones: StoreReferralMilestone[] }> => {
    const res = await apiClient.get<{ milestones: StoreReferralMilestone[] }>("/store/customer-referrals/milestones");
    return res.data;
  },

  createMilestone: async (data: Partial<StoreReferralMilestone>): Promise<{ ok: boolean; milestone: StoreReferralMilestone }> => {
    const res = await apiClient.post<{ ok: boolean; milestone: StoreReferralMilestone }>("/store/customer-referrals/milestones", data);
    return res.data;
  },

  updateMilestone: async (id: string, data: Partial<StoreReferralMilestone>): Promise<{ ok: boolean; milestone: StoreReferralMilestone }> => {
    const res = await apiClient.patch<{ ok: boolean; milestone: StoreReferralMilestone }>(`/store/customer-referrals/milestones/${id}`, data);
    return res.data;
  },

  deleteMilestone: async (id: string): Promise<{ ok: boolean; deleted: boolean }> => {
    const res = await apiClient.delete<{ ok: boolean; deleted: boolean }>(`/store/customer-referrals/milestones/${id}`);
    return res.data;
  },
};
