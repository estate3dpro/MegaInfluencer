import { apiClient } from "@/lib/api/client";

export type StoreCollection = {
  id: string;
  shopifyId: string;
  title: string;
  handle: string | null;
  imageUrl: string | null;
  productCount: number;
  activeLinksCount: number;
  syncedAt: string;
};

export type CollectionSync = {
  status: "IDLE" | "RUNNING" | "COMPLETED" | "FAILED";
  synced: number;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
};

export async function getStoreCollections(search?: string) {
  return (await apiClient.get<{ collections: StoreCollection[] }>("/store/collections", { params: search ? { search } : undefined })).data.collections;
}

export async function syncStoreCollections() {
  return (await apiClient.post<{ sync: CollectionSync; alreadyRunning: boolean }>("/store/collections/sync")).data;
}
