import { apiClient } from "@/lib/api/client";
export type Store = {
  id: string;
  name: string;
  slug: string;
  platform: "SHOPIFY" | "WOOCOMMERCE" | "CUSTOM";
  connectionStatus: "PENDING" | "CONNECTED" | "DISABLED";
  category: string | null;
  logoUrl: string | null;
  shopDomain: string | null;
  appUrl: string | null;
  apiUrl: string | null;
  shopifyConnectionMethod?: "CLI_APP" | "ADMIN_API" | null;
  hasShopifyAccessToken?: boolean;
  createdAt: string;
  owner: { id: string; displayName: string; email: string | null };
  _count: { assignments: number };
};
export type StoreInput = {
  name: string;
  ownerName: string;
  ownerEmail: string;
  password?: string;
  platform: Store["platform"];
  connectionStatus: Store["connectionStatus"];
  category?: string;
  logoUrl?: string;
  shopDomain?: string;
  appUrl?: string;
  apiUrl?: string;
  shopifyConnectionMethod?: "CLI_APP" | "ADMIN_API";
  shopifyAccessToken?: string;
};
export async function getStores() {
  return (await apiClient.get<{ stores: Store[] }>("/admin/stores")).data.stores;
}
export async function createStore(input: StoreInput) {
  return (await apiClient.post<{ store: Store }>("/admin/stores", input)).data.store;
}
export async function updateStore(id: string, input: StoreInput) {
  return (await apiClient.patch<{ store: Store }>(`/admin/stores/${id}`, input)).data.store;
}
export async function getAssignments(id: string) {
  return (
    await apiClient.get<{
      store: { id: string; name: string };
      influencers: {
        id: string;
        displayName: string;
        instagramUsername: string | null;
        assigned: boolean;
      }[];
    }>(`/admin/stores/${id}/assignments`)
  ).data;
}
export async function saveAssignments(id: string, influencerIds: string[]) {
  await apiClient.put(`/admin/stores/${id}/assignments`, { influencerIds });
}
