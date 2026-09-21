import { apiClient } from "@/lib/api/client";

export type InfluencerStoresOverview = {
  stores: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  scopeData: Record<
    string,
    {
      sales: string;
      orders: string;
      earnings: string;
      clicks: string;
      conversion: string;
    }
  >;
  storeMix: Array<{
    name: string;
    percentage: number;
  }>;
  products: Array<{
    name: string;
    store: string;
    storeSlug: string;
    price: string;
    clicks: number;
    orders: number;
    tone: string;
  }>;
  timelineBars: number[];
};

export async function getInfluencerStoresOverview() {
  return (await apiClient.get<InfluencerStoresOverview>("/influencer/stores/overview")).data;
}
