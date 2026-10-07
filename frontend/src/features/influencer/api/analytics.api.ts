import { apiClient } from "@/lib/api/client";

export type PlatformPerformanceItem = {
  platform: string;
  name: string;
  clicks: number;
  uniqueVisitors: number;
  orders: number;
  sales: number;
  earnings: number;
  conversionRate: number;
  share: number;
  topMedium: string;
  color: string;
  badgeClass: string;
};

export type PlatformTimelinePoint = {
  date: string;
  day: string;
  totalClicks: number;
  totalOrders: number;
  totalSales: number;
  totalEarnings: number;
  whatsappClicks: number;
  instagramClicks: number;
  facebookClicks: number;
  youtubeClicks: number;
  tiktokClicks: number;
  otherClicks: number;
};

export type InfluencerAnalytics = {
  overview: Array<{
    label: string;
    value: string;
    change: string;
  }>;
  summary: {
    totalClicks: number;
    totalOrders: number;
    totalSales: number;
    totalEarnings: number;
    conversionRate: number;
    avgOrderValue: number;
  };
  platformBreakdown: PlatformPerformanceItem[];
  allPlatforms: PlatformPerformanceItem[];
  platformTimeline: PlatformTimelinePoint[];
  storesList: Array<{ id: string; name: string; slug: string }>;
  audienceTrend?: Array<{
    day: string;
    followers: number;
    reached: number;
  }>;
  audienceQuality?: {
    engagementRate: string;
    engagementRatePercentage: number;
    returningViewers: string;
    returningViewersPercentage: number;
    savesPerReach: string;
    savesPerReachPercentage: number;
    insight: string;
  };
  contentPerformance?: Array<{
    label: string;
    reach: number;
    engagement: number;
  }>;
  conversionImpact: {
    linkClicks: string;
    linkClicksDetail: string;
    attributedSales: string;
    attributedSalesDetail: string;
    ordersGenerated: string;
    ordersGeneratedDetail: string;
  };
  topContent?: Array<{
    title: string;
    type: string;
    reach: string;
    engagement: string;
    rate: string;
    tone: string;
  }>;
};

export async function getInfluencerAnalytics(
  range: string = "30d",
  platform: string = "all",
  storeId?: string,
) {
  return (
    await apiClient.get<InfluencerAnalytics>("/influencer/analytics", {
      params: { range, platform, storeId },
    })
  ).data;
}
