import { apiClient } from "@/lib/api/client";

export type MonthlyEarningsTimeline = {
  month: string;
  earnings: number;
  earningsFormatted: string;
  sales: number;
  orders: number;
};

export type RecentCommissionItem = {
  id: string;
  type?: "COMMISSION" | "FIXED_FEE" | "HYBRID_BASE";
  orderName: string;
  storeName: string;
  amount: string;
  amountRaw: number;
  status: "APPROVED" | "PENDING" | "PAID" | "REVERSED" | "CANCELLED";
  date: string;
};

export type BarterSampleFulfillmentItem = {
  id: string;
  campaignTitle: string;
  storeName: string;
  productTitle: string;
  trackingNumber?: string;
  carrier?: string;
  status: "PENDING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED";
  shippedAt?: string | null;
  deliveredAt?: string | null;
};

export type InfluencerEarningsResponse = {
  balances: {
    availableToWithdraw: string;
    availableToWithdrawRaw: number;
    pendingApproval: string;
    pendingApprovalRaw: number;
    pendingOrdersCount: number;
    lifetimeEarnings: string;
    lifetimeEarningsRaw: number;
    paidEarnings: string;
    currentPeriodEarnings: string;
    growthRate: string;
    isGrowthPositive: boolean;
  };
  timeline: MonthlyEarningsTimeline[];
  recentCommissions: RecentCommissionItem[];
  barterFulfillments?: BarterSampleFulfillmentItem[];
};

export async function getInfluencerEarnings(scope: string = "all"): Promise<InfluencerEarningsResponse> {
  const params: Record<string, string> = {};
  if (scope && scope !== "all") params.scope = scope;

  return (
    await apiClient.get<InfluencerEarningsResponse>("/influencer/earnings", {
      params,
    })
  ).data;
}
