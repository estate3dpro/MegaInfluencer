import { apiClient } from "@/lib/api/client";

export type TimelinePoint = {
  label: string;
  date: string;
  sales: number;
  salesFormatted: string;
  orders: number;
  clicks: number;
  height: number;
};

export type InfluencerStoresOverview = {
  isBarterOnly: boolean;
  stores: Array<{
    id: string;
    name: string;
    slug: string;
    shopDomain?: string | null;
  }>;
  scopeData: Record<
    string,
    {
      sales: string;
      orders: string;
      earnings: string;
      clicks: string;
      conversion: string;
      bars?: number[];
      timeline?: TimelinePoint[];
    }
  >;
  storeMix: Array<{
    name: string;
    percentage: number;
  }>;
  products: Array<{
    id?: string;
    name: string;
    store: string;
    storeSlug: string;
    shopDomain?: string | null;
    price: string;
    clicks: number;
    orders: number;
    tone: string;
    imageUrl?: string | null;
    affiliateSlug?: string | null;
    affiliateUrl?: string | null;
    affiliateDirectUrl?: string | null;
  }>;
  timelineBars: number[];
  timelineLabels?: string[];
  timeline?: TimelinePoint[];
};

export async function getInfluencerStoresOverview() {
  return (await apiClient.get<InfluencerStoresOverview>("/influencer/stores/overview")).data;
}
