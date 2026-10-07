import { apiClient } from "@/lib/api/client";

export type CompensationMode = "COMMISSION" | "BARTER" | "HYBRID";

export type StoreCreator = {
  id: string;
  displayName: string;
  email: string | null;
  status: string;
  creatorCode: string | null;
  instagramUsername: string | null;
  instagramStatus: string | null;
  instagramFollowersCount?: number | null;
  instagramMediaCount?: number | null;
  assignedAt: string;
  totalSales?: number;
  totalOrders?: number;
  totalCommissions?: number;
  activeLinks?: number;
  compensationMode: CompensationMode;
  barterOrders?: number;
  barterGmv?: number;
  sampleCount?: number;
  recentSample?: {
    id: string;
    productTitle: string;
    status: string;
    trackingNumber?: string | null;
    carrier?: string | null;
  } | null;
};

export type AvailableCreator = {
  id: string;
  displayName: string;
  email: string | null;
  creatorCode: string | null;
  instagramUsername: string | null;
  instagramFollowersCount?: number | null;
  instagramMediaCount?: number | null;
  influencerProfile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    city?: string;
  } | null;
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
  orderName: string;
  orderAmount: number;
  commissionRate: number;
  amount: number;
  status: "PENDING" | "APPROVED" | "PAID" | "REVERSED";
  createdAt: string;
  creatorMode?: CompensationMode;
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
    pendingCount: number;
  };
};

export async function getStoreCreators() {
  return (await apiClient.get<{ creators: StoreCreator[] }>("/store/creators")).data.creators;
}

export async function getAvailableCreators() {
  return (await apiClient.get<{ creators: AvailableCreator[] }>("/store/creators/available")).data
    .creators;
}

export async function assignStoreCreator(influencerId: string, compensationMode: CompensationMode = "COMMISSION") {
  return (
    await apiClient.post<{ ok: boolean; assignment: any }>("/store/creators/assign", {
      influencerId,
      compensationMode,
    })
  ).data;
}

export async function updateCreatorCompensationMode(
  creatorId: string,
  compensationMode: CompensationMode,
) {
  return (
    await apiClient.patch<{ ok: boolean; compensationMode: CompensationMode }>(
      `/store/creators/${creatorId}/compensation-mode`,
      { compensationMode },
    )
  ).data;
}

export async function sendBarterSample(
  creatorId: string,
  data: {
    productTitle: string;
    productId?: string;
    carrier?: string;
    trackingNumber?: string;
    shippingAddress?: string;
    status?: string;
  },
) {
  return (await apiClient.post<{ ok: boolean; sample: any }>(`/store/creators/${creatorId}/barter-sample`, data)).data;
}

export async function getStoreCreatorDetails(creatorId: string) {
  return (
    await apiClient.get<{
      creator: {
        id: string;
        displayName: string;
        email: string | null;
        creatorCode: string | null;
        instagramUsername: string | null;
        instagramFollowersCount?: number | null;
        assignedProductIds: string[];
        compensationMode: CompensationMode;
      };
    }>(`/store/creators/${creatorId}`)
  ).data.creator;
}

export async function updateStoreCreatorProducts(creatorId: string, productIds: string[]) {
  return (
    await apiClient.put<{ ok: boolean; assignedProductIds: string[] }>(
      `/store/creators/${creatorId}/products`,
      { productIds },
    )
  ).data;
}

export async function getStoreAssignableProducts() {
  return (await apiClient.get<{ products: AssignableProduct[] }>("/store/products/assignable")).data
    .products;
}

export async function getStoreCommissions(status?: string, search?: string) {
  return (
    await apiClient.get<CommissionsResponse>("/store/commissions", {
      params: { status, search },
    })
  ).data;
}

export async function updateCommissionStatus(
  commissionId: string,
  status: "PENDING" | "APPROVED" | "PAID" | "REVERSED",
) {
  return (
    await apiClient.patch<{ ok: boolean; commission: any }>(
      `/store/commissions/${commissionId}/status`,
      { status },
    )
  ).data;
}

export async function bulkApproveCommissions() {
  return (await apiClient.post<{ ok: boolean; count: number; message: string }>("/store/commissions/bulk-approve")).data;
}

export async function getCreatorAssignedProducts(creatorId: string) {
  const [details, allProducts] = await Promise.all([
    getStoreCreatorDetails(creatorId),
    getStoreAssignableProducts(),
  ]);
  const assignedSet = new Set(details.assignedProductIds || []);
  const products = allProducts.map((p) => ({
    ...p,
    isAssigned: assignedSet.has(p.id),
  }));
  return { products, assignedCount: details.assignedProductIds?.length ?? 0 };
}

export async function updateCreatorAssignedProducts(creatorId: string, productIds: string[]) {
  const res = await updateStoreCreatorProducts(creatorId, productIds);
  return { ok: true, assignedCount: res.assignedProductIds?.length ?? 0 };
}

