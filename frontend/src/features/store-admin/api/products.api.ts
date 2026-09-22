import { apiClient } from "@/lib/api/client";

export type StoreProduct = {
  id: string;
  name: string;
  sku: string;
  handle: string;
  imageUrl: string | null;
  stock: number;
  price: string;
  currency: string;
  vendor: string | null;
  productType: string | null;
  status: string | null;
  salesTotal: number;
  ordersCount: number;
  unitsSold: number;
  creatorSales: number;
  creatorOrders: number;
  assignedCreatorsCount: number;
  activeLinksCount: number;
  shopifyId: string;
};

export type ProductCatalogSummary = {
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalCatalogValue: number;
  totalSales: number;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductSync = {
  status: "IDLE" | "RUNNING" | "COMPLETED" | "FAILED";
  synced: number;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
};

export type ProductDetails = {
  product: {
    id: string;
    organizationId: string;
    shopifyId: string;
    title: string;
    handle: string | null;
    status: string | null;
    vendor: string | null;
    productType: string | null;
    descriptionHtml: string | null;
    imageUrl: string | null;
    inventoryTotal: number;
    price: string | null;
    currency: string | null;
    syncedAt: string;
    shopDomain: string | null;
    payload?: any;
  };
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    unitsSold: number;
    creatorRevenue: number;
    creatorOrders: number;
    creatorCommissions: number;
    totalClicks: number;
    conversionRate: number;
  };
  assignedCreators: Array<{
    id: string;
    name: string;
    email: string | null;
    creatorCode: string | null;
    handle: string;
    assignedAt: string;
    activeLinksCount: number;
    sales: number;
    orders: number;
    commission: number;
  }>;
  availableCreators: Array<{
    id: string;
    displayName: string;
    creatorCode: string | null;
    email: string | null;
    instagramUsername: string | null;
  }>;
  affiliateLinks: Array<{
    id: string;
    slug: string;
    url: string;
    commissionRate: number;
    status: "ACTIVE" | "PAUSED";
    expiresAt: string | null;
    createdAt: string;
    clicks: number;
    orders: number;
    revenue: number;
    commission: number;
    creator: {
      id: string;
      name: string;
      creatorCode: string | null;
      handle: string;
    } | null;
  }>;
  recentOrders: Array<{
    id: string;
    name: string;
    email: string | null;
    total: string | null;
    currency: string | null;
    financialStatus: string | null;
    fulfillmentStatus: string | null;
    processedAt: string | null;
    creatorCode: string | null;
    quantity: number;
  }>;
};

export async function getStoreProducts(
  page = 1,
  options: { search?: string; all?: boolean; stock?: string } = {}
) {
  return (
    await apiClient.get<{
      products: StoreProduct[];
      shopDomain?: string | null;
      summary?: ProductCatalogSummary;
      pagination: Pagination;
    }>("/store/products", { params: { page, limit: 25, ...options } })
  ).data;
}

export async function getStoreProductDetails(productId: string) {
  return (await apiClient.get<ProductDetails>(`/store/products/${productId}`)).data;
}

export async function syncStoreProducts() {
  return (await apiClient.post<{ sync: ProductSync; alreadyRunning: boolean }>("/store/products/sync")).data;
}

export async function getStoreProductSyncStatus() {
  return (await apiClient.get<{ sync: ProductSync }>("/store/products/sync/status")).data;
}

export async function assignCreatorToProduct(
  productId: string,
  data: { creatorId: string; commissionRate?: number; generateLink?: boolean }
) {
  return (await apiClient.post<{ ok: boolean; link?: any }>(`/store/products/${productId}/assignments`, data)).data;
}

export async function unassignCreatorFromProduct(productId: string, creatorId: string) {
  return (await apiClient.delete<{ ok: boolean }>(`/store/products/${productId}/assignments/${creatorId}`)).data;
}

export async function createProductAffiliateLink(
  productId: string,
  data: { creatorId?: string | null; commissionRate: number; expiresAt?: string | null }
) {
  return (await apiClient.post<{ ok: boolean; link: any }>(`/store/products/${productId}/links`, data)).data;
}
