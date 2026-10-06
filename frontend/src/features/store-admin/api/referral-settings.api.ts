import { apiClient } from "@/lib/api/client";

export type ReferralRewardMode = "POINTS" | "CASHBACK_COMMISSION" | "DISCOUNT_ONLY" | "HYBRID";

export type StoreReferralConfig = {
  id: string;
  organizationId: string;
  isEnabled: boolean;
  rewardMode: ReferralRewardMode;
  
  // Rule 1: Percentage
  percentageEnabled: boolean;
  commissionRate: number;
  pointsPerCurrency: number;

  // Rule 2: Spend Ratio (X tokens per Y spent)
  spendTokensEnabled: boolean;
  spendTokensRate: number;
  spendTokensAmount: number;

  // Rule 3: Fixed Flat Tokens per Order
  fixedTokensEnabled: boolean;
  fixedTokensPerOrder: number;

  // Rule 4: Welcome Bonus
  welcomeBonusEnabled: boolean;
  welcomeBonusPoints: number;

  minPayoutAmount: number;
  friendDiscountEnabled: boolean;
  friendDiscountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  friendDiscountValue: number;
  showTierRoadmap: boolean;
  showPerformanceCharts: boolean;
  showRewardsStore: boolean;
  showRecentPurchases: boolean;
  programTitle: string | null;
  customShareMessage: string | null;
  accentColor: string | null;
  updatedAt: string;
};

export async function getStoreReferralSettings() {
  return (await apiClient.get<{ store: any; config: StoreReferralConfig }>("/store/referral-settings")).data;
}

export async function updateStoreReferralSettings(payload: Partial<StoreReferralConfig>) {
  return (await apiClient.patch<{ ok: boolean; config: StoreReferralConfig }>("/store/referral-settings", payload)).data;
}

export const referralSettingsApi = {
  getSettings: getStoreReferralSettings,
  updateSettings: updateStoreReferralSettings,
};
