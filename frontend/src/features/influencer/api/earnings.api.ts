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
  orderName: string;
  storeName: string;
  amount: string;
  amountRaw: number;
  status: "APPROVED" | "PENDING" | "PAID" | "REVERSED";
  date: string;
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
