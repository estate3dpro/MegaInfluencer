import { apiClient } from "@/lib/api/client";

export type StoreProduct = { id: string; name: string; sku: string; imageUrl: string | null; stock: number; price: string; currency: string };

export type Pagination = { page: number; limit: number; total: number; totalPages: number };
export type ProductSync = { status: "IDLE" | "RUNNING" | "COMPLETED" | "FAILED"; synced: number; startedAt: string | null; completedAt: string | null; error: string | null };
export async function getStoreProducts(page = 1) {
  return (await apiClient.get<{ products: StoreProduct[]; pagination: Pagination }>("/store/products", { params: { page, limit: 25 } })).data;
}
export async function syncStoreProducts() { return (await apiClient.post<{ sync: ProductSync; alreadyRunning: boolean }>("/store/products/sync")).data; }
export async function getStoreProductSyncStatus() { return (await apiClient.get<{ sync: ProductSync }>("/store/products/sync/status")).data; }
