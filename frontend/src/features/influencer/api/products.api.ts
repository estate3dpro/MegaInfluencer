import { apiClient } from "@/lib/api/client";

export type InfluencerProduct = {
  id: string;
  name: string;
  store: string;
  storeSlug: string;
  price: string;
  orders: number;
  tone: string;
  imageUrl: string | null;
  handle: string | null;
  affiliateSlug: string | null;
  affiliateUrl: string | null;
};

export type InfluencerProductsResponse = {
  products: InfluencerProduct[];
  stores: Array<{ id: string; name: string; slug: string }>;
};

export async function getInfluencerProducts(storeSlug?: string, search?: string) {
  return (
    await apiClient.get<InfluencerProductsResponse>("/influencer/products", {
      params: { storeSlug, search },
    })
  ).data;
}
