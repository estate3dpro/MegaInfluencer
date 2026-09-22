import { apiClient } from "@/lib/api/client";

export type InfluencerDashboard = {
  creatorCode: string | null;
  metrics: { earnings: number; sales: number; orders: number; clicks: number; earningsChange: number; clicksChange: number };
  earnings: Array<{ date: string; amount: number }>;
  campaigns: Array<{ id: string; title: string; brand: string; status: string; deadline: string | null; campaignStatus: string }>;
  activity: Array<{ id: string; title: string; detail: string; amount: number; createdAt: string }>;
};

export async function getInfluencerDashboard() {
  return (await apiClient.get<InfluencerDashboard>("/influencer/dashboard")).data;
}
