import { apiClient } from "@/lib/api/client";

export type StoreCreator = {
  id: string;
  displayName: string;
  email: string | null;
  status: string;
  creatorCode: string | null;
  instagramUsername: string | null;
  instagramStatus: string | null;
  assignedAt: string;
  totalSales?: number;
  totalOrders?: number;
  totalCommissions?: number;
  activeLinks?: number;
  };

export type AvailableCreator = {
  id: string;
  displayName: string;
  email: string | null;
  creatorCode: string | null;
  instagramUsername: string | null;
};

export type AssignableProduct = {
  id: string;
  title: string;
  price: string | null;
  imageUrl: string | null;
  handle: string | null;
  vendor: string | null;
  isAssigned: boolean;
};

export type CommissionItem = {
  id: string;
  orderId: string;
  orderNumber: string;
  orderAmount: number;
  commissionRate: number;
  amount: number;
  status: "PENDING" | "APPROVED" | "PAID" | "REVERSED";
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string | null;
    code: string | null;
    instagram: string | null;
  } | null;
};

export type CommissionsResponse = {
  commissions: CommissionItem[];
  metrics: {
    pendingAmount: number;
    approvedAmount: number;
    paidAmount: number;
    totalCount: number;
  };
};

export async function getStoreCreators() {
  return (await apiClient.get<{ creators: StoreCreator[] }>("/store/creators")).data.creators;
}

export async function getAvailableCreators() {
  return (await apiClient.get<{ creators: AvailableCreator[] }>("/store/creators/available")).data.creators;
}

export async function assignStoreCreator(influencerId: string) {
  return (await apiClient.post<{ ok: boolean; assignment: any }>("/store/creators/assign", { influencerId })).data;
}

export async function getStoreCreatorDetails(creatorId: string) {
  return (await apiClient.get<{ creator: any; assignedAt: string; instagramStatistics: any }>(`/store/creators/${creatorId}`)).data;
}

export async function getCreatorAssignedProducts(creatorId: string) {
  return (await apiClient.get<{ products: AssignableProduct[]; assignedCount: number }>(`/store/creators/${creatorId}/products`)).data;
}

export async function updateCreatorAssignedProducts(creatorId: string, productIds: string[]) {
  return (await apiClient.put<{ ok: boolean; assignedCount: number }>(`/store/creators/${creatorId}/products`, { productIds })).data;
}

export async function getStoreCommissions(params?: { status?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);
  const query = searchParams.toString();
  return (await apiClient.get<CommissionsResponse>(`/store/commissions${query ? `?${query}` : ""}`)).data;
}

export async function updateCommissionStatus(commissionId: string, status: "PENDING" | "APPROVED" | "PAID" | "REVERSED") {
  return (await apiClient.patch<{ ok: boolean; commission: any }>(`/store/commissions/${commissionId}/status`, { status })).data;
}
