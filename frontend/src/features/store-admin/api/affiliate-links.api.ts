import { apiClient } from "@/lib/api/client";

export type AffiliateLink = {
  id: string; creatorId: string | null; creator: string | null; creatorCode: string | null; productId: string | null; product: string | null;
  slug: string; url: string; targetType: "STORE" | "PRODUCT" | "COLLECTION"; commissionRate: number;
  status: "ACTIVE" | "PAUSED"; expiresAt: string | null; clicks: number; orders: number;
  revenue: number; storeCredits: number; conversion: number; createdAt: string;
  collectionId?: string | null; collection?: string | null;
};
export type CreateAffiliateLinkInput = {
  creatorId?: string | null;
  productId?: string | null;
  productIds?: string[];
  collectionId?: string | null;
  commissionRate: number;
};
export async function getAffiliateLinks(params?: { search?: string; status?: "ACTIVE" | "PAUSED" }) {
  return (await apiClient.get<{ links: AffiliateLink[] }>("/store/affiliate-links", { params })).data.links;
}
export async function createAffiliateLink(input: CreateAffiliateLinkInput) {
  return (await apiClient.post<{ link: AffiliateLink }>("/store/affiliate-links", input)).data.link;
}
export async function updateAffiliateLink(id: string, input: { status: "ACTIVE" | "PAUSED" }) {
  return (await apiClient.patch<{ link: AffiliateLink }>(`/store/affiliate-links/${id}`, input)).data.link;
}
