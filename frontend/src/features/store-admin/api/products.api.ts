import { apiClient } from "@/lib/api/client";

export type StoreProduct = { id: string; name: string; sku: string; imageUrl: string | null; stock: number; price: string; currency: string };

export type Pagination = { page: number; limit: number; total: number; totalPages: number };
export async function getStoreProducts(page = 1) {
  return (await apiClient.get<{ products: StoreProduct[]; pagination: Pagination }>("/store/products", { params: { page, limit: 25 } })).data;
}
export async function syncStoreProducts() { return (await apiClient.post<{ synced: number }>("/store/products/sync")).data; }
