import { apiClient } from "@/lib/api/client";

export type StoreCreator = {
  id: string;
  displayName: string;
  email: string | null;
  status: string;
  instagramUsername: string | null;
  instagramStatus: string | null;
  assignedAt: string;
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

export async function getStoreCreators() {
  return (await apiClient.get<{ creators: StoreCreator[] }>("/store/creators")).data.creators;
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
