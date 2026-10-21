import { apiClient } from "@/lib/api/client";

export type AffiliateLink = {
  id: string; creatorId: string | null; creator: string | null; creatorCode: string | null; productId: string | null; product: string | null;
  slug: string; url: string; directUrl?: string | null; shopDomain?: string | null; destinationPath?: string | null; targetType: "STORE" | "PRODUCT" | "COLLECTION";
  commissionType?: "PERCENTAGE" | "FIXED_AMOUNT";
  commissionRate: number;
  commissionAmount?: number | null;
  status: "ACTIVE" | "PAUSED"; expiresAt: string | null; clicks: number; orders: number;
  revenue: number; storeCredits: number; conversion: number; createdAt: string;
  collectionId?: string | null; collection?: string | null;
};
export type CreateAffiliateLinkInput = {
  creatorId?: string | null;
  productId?: string | null;
  productIds?: string[];
  collectionId?: string | null;
  commissionType?: "PERCENTAGE" | "FIXED_AMOUNT";
  commissionRate?: number;
  commissionAmount?: number | null;
};
export type AffiliateLinkReport = {
  link: {
    id: string;
    slug: string;
    destination: string;
    targetType: AffiliateLink["targetType"];
    status: AffiliateLink["status"];
    commissionType: "PERCENTAGE" | "FIXED_AMOUNT";
    commissionRate: number;
    commissionAmount: number | null;
    creator: { id: string; name: string; creatorCode: string | null; email: string | null; instagramUsername: string | null } | null;
  };
  metrics: { clicks: number; totalOrders: number; gmv: number; averageOrderAmount: number; creatorEarnings: number; conversionRate: number };
  orders: Array<{
    id: string;
    name: string;
    email: string | null;
    amount: number;
    currency: string;
    financialStatus: string | null;
    fulfillmentStatus: string | null;
    processedAt: string | null;
    commissionAmount: number;
    commissionStatus: "PENDING" | "APPROVED" | "PAID" | "REVERSED" | null;
    commissionType: string;
    commissionRate: number;
  }>;
};
export async function getAffiliateLinks(params?: { search?: string; status?: "ACTIVE" | "PAUSED" }) {
  return (await apiClient.get<{ links: AffiliateLink[] }>("/store/affiliate-links", { params })).data.links;
}
export async function createAffiliateLink(input: CreateAffiliateLinkInput) {
  return (await apiClient.post<{ link: AffiliateLink }>("/store/affiliate-links", input)).data.link;
}
export async function updateAffiliateLink(
  id: string,
  input: {
    status?: "ACTIVE" | "PAUSED";
    commissionType?: "PERCENTAGE" | "FIXED_AMOUNT";
    commissionRate?: number;
    commissionAmount?: number | null;
    expiresAt?: string | null;
  }
) {
  return (await apiClient.patch<{ link: AffiliateLink }>(`/store/affiliate-links/${id}`, input)).data.link;
}
export async function getAffiliateLinkReport(id: string) {
  return (await apiClient.get<AffiliateLinkReport>(`/store/affiliate-links/${id}/report`)).data;
}
