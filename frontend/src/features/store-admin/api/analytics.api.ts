import { apiClient } from "@/lib/api/client";

export type MetricItem = {
  value: number;
  change: number;
};

export type AnalyticsTimelinePoint = {
  date: string;
  day: string;
  clicks: number;
  orders: number;
  sales: number;
};

export type PlacementShare = {
  name: string;
  clicks: number;
  share: number;
  color: string;
};

export type CreatorLeaderboardItem = {
  rank: number;
  id: string;
  name: string;
  handle: string;
  initials: string;
  clicks: number;
  orders: number;
  sales: number;
  commission: number;
  conversionRate: number;
  tier: "Diamond" | "Gold" | "Silver" | "Bronze";
  tierColor: string;
  isInstagramConnected: boolean;
  color: string;
};

export type TopProductItem = {
  id: string;
  name: string;
  price: string | null;
  imageUrl: string | null;
  sales: number;
  orders: number;
};

export type StoreAnalyticsResponse = {
  summary: {
    totalInstagramClicks: MetricItem;
    totalCreatorSales: MetricItem;
    totalCreatorOrders: MetricItem;
    conversionRate: MetricItem;
    totalCommissions: MetricItem;
    avgOrderValue: number;
    totalStoreOrders: number;
  };
  timeline: AnalyticsTimelinePoint[];
  placements: PlacementShare[];
  leaderboard: CreatorLeaderboardItem[];
  topProducts: TopProductItem[];
};

export async function getStoreAnalytics(range: "7d" | "30d" | "90d" = "30d") {
  const response = await apiClient.get<StoreAnalyticsResponse>("/store/analytics", {
    params: { range },
  });
  return response.data;
}
