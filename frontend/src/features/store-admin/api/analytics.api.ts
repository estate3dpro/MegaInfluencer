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
  commissions: number;
  whatsappClicks?: number;
  instagramClicks?: number;
  facebookClicks?: number;
  youtubeClicks?: number;
  tiktokClicks?: number;
  otherClicks?: number;
};

export type PlatformPerformanceItem = {
  platform: string;
  name: string;
  clicks: number;
  uniqueVisitors: number;
  orders: number;
  sales: number;
  commissions: number;
  conversionRate: number;
  share: number;
  topMedium: string;
  color: string;
  badgeClass: string;
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
    totalClicks?: MetricItem;
    totalInstagramClicks: MetricItem;
    totalCreatorSales: MetricItem;
    totalCreatorOrders: MetricItem;
    conversionRate: MetricItem;
    totalCommissions: MetricItem;
    avgOrderValue: number;
    totalStoreOrders: number;
  };
  platformBreakdown: PlatformPerformanceItem[];
  allPlatforms: PlatformPerformanceItem[];
  platformTimeline: AnalyticsTimelinePoint[];
  timeline: AnalyticsTimelinePoint[];
  creatorsList: Array<{ id: string; name: string; code: string | null }>;
  placements?: PlacementShare[];
  leaderboard: CreatorLeaderboardItem[];
  topProducts: TopProductItem[];
};

export async function getStoreAnalytics(
  range: string = "30d",
  platform: string = "all",
  creatorId?: string,
) {
  const response = await apiClient.get<StoreAnalyticsResponse>("/store/analytics", {
    params: { range, platform, creatorId },
  });
  return response.data;
}
