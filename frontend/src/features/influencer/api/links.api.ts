import { apiClient } from "@/lib/api/client";

export type InfluencerTrackedLink = {
  id: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  productId?: string | null;
  productTitle?: string | null;
  productImage?: string | null;
  productPrice?: string | null;
  slug: string;
  url: string;
  targetType: "STORE" | "PRODUCT";
  commissionRate: number;
  status: "ACTIVE" | "PAUSED";
  clicks: number;
  orders: number;
  revenue: number;
  earnings: number;
  conversion: string;
  createdAt: string;
};

export type GetInfluencerLinksResponse = {
  links: InfluencerTrackedLink[];
};

export type CreateInfluencerLinkInput = {
  organizationId: string;
  productId?: string | null;
  customSlug?: string | null;
};

export async function getInfluencerLinks(storeId?: string, search?: string): Promise<GetInfluencerLinksResponse> {
  const params: Record<string, string> = {};
  if (storeId && storeId !== "all") params.storeId = storeId;
  if (search) params.search = search;

  return (
    await apiClient.get<GetInfluencerLinksResponse>("/influencer/affiliate-links", {
      params,
    })
  ).data;
}

export async function createInfluencerLink(input: CreateInfluencerLinkInput): Promise<{ link: InfluencerTrackedLink }> {
  return (await apiClient.post<{ link: InfluencerTrackedLink }>("/influencer/affiliate-links", input)).data;
}
