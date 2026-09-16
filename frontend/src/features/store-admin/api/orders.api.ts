import { apiClient } from "@/lib/api/client";
export type StoreOrder = { id: string; name: string; email: string | null; currency: string | null; total: string | null; financialStatus: string | null; fulfillmentStatus: string | null; processedAt: string | null };
import type { Pagination } from "./products.api";
export async function getStoreOrders(page = 1) { return (await apiClient.get<{ orders: StoreOrder[]; pagination: Pagination }>("/store/orders", { params: { page, limit: 25 } })).data; }
export async function syncStoreOrders() { return (await apiClient.post<{ synced: number }>("/store/orders/sync")).data; }
