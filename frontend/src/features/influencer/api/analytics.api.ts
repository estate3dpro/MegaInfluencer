import { apiClient } from "@/lib/api/client";

export type InfluencerAnalytics = {
  overview: Array<{
    label: string;
    value: string;
    change: string;
  }>;
  audienceTrend: Array<{
    day: string;
    followers: number;
    reached: number;
  }>;
  audienceQuality: {
    engagementRate: string;
    engagementRatePercentage: number;
    returningViewers: string;
    returningViewersPercentage: number;
    savesPerReach: string;
    savesPerReachPercentage: number;
    insight: string;
  };
  contentPerformance: Array<{
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
  topContent: Array<{
    title: string;
    type: string;
    reach: string;
    engagement: string;
    rate: string;
    tone: string;
  }>;
};

export async function getInfluencerAnalytics(range: string = "30d") {
  return (await apiClient.get<InfluencerAnalytics>("/influencer/analytics", { params: { range } })).data;
}
