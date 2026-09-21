import { apiClient } from "@/lib/api/client";

export type InfluencerStatus = "ACTIVE" | "SUSPENDED";
export type InfluencerListItem = {
  id: string;
  displayName: string;
  email: string | null;
  status: InfluencerStatus;
  createdAt: string;
  instagramUsername: string | null;
  instagramId: string | null;
  instagramConnectionStatus: "ACTIVE" | "EXPIRED" | "REVOKED" | null;
};
export type InfluencerDetails = {
  id: string;
  displayName: string;
  email: string | null;
  status: InfluencerStatus;
  createdAt: string;
  updatedAt: string;
  instagramConnection: {
    instagramUserId: string;
    username: string;
    displayName: string | null;
    status: "ACTIVE" | "EXPIRED" | "REVOKED";
    tokenExpiresAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};
export type InfluencerListResponse = {
  influencers: InfluencerListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};
export type AdminInstagramProfile = {
  connection: {
    instagramUserId: string;
    username: string;
    displayName: string | null;
    status: "ACTIVE" | "EXPIRED" | "REVOKED";
    connectedAt: string;
    tokenExpiresAt: string | null;
  } | null;
  profile: {
    id: string;
    username: string;
    name?: string;
    media_count?: number;
    followers_count?: number;
    follows_count?: number;
  } | null;
  unavailableReason: string | null;
};

export async function getInfluencers(params: {
  page: number;
  status?: InfluencerStatus;
  search?: string;
}) {
  const { data } = await apiClient.get<InfluencerListResponse>("/admin/influencers", { params });
  return data;
}
export async function getInfluencer(id: string) {
  const { data } = await apiClient.get<{ influencer: InfluencerDetails }>(
    `/admin/influencers/${id}`,
  );
  return data.influencer;
}
export async function updateInfluencerStatus(id: string, status: InfluencerStatus) {
  const { data } = await apiClient.patch<{
    influencer: Pick<InfluencerDetails, "id" | "status" | "updatedAt">;
  }>(`/admin/influencers/${id}/status`, { status });
  return data.influencer;
}
export async function getAdminInstagramProfile(id: string) {
  const { data } = await apiClient.get<AdminInstagramProfile>(
    `/admin/influencers/${id}/instagram-profile`,
  );
  return data;
}

export type AdminStoreProducts = {
  id: string;
  name: string;
  slug: string;
  products: Array<{
    id: string;
    title: string;
    price: string | null;
    imageUrl: string | null;
    handle: string | null;
    vendor: string | null;
    isAssigned: boolean;
  }>;
};

export async function getAdminInfluencerAssignedProducts(id: string) {
  const { data } = await apiClient.get<{ stores: AdminStoreProducts[]; assignedCount: number }>(
    `/admin/influencers/${id}/products`,
  );
  return data;
}

export async function updateAdminInfluencerAssignedProducts(id: string, productIds: string[], storeId?: string) {
  const { data } = await apiClient.put<{ ok: boolean; assignedCount: number }>(
    `/admin/influencers/${id}/products`,
    { productIds, storeId },
  );
  return data;
}

