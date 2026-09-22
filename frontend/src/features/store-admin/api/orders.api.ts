import { apiClient } from "@/lib/api/client";
import type { Pagination } from "./products.api";

export type OrderSummary = {
  totalOrders: number;
  totalSales: number;
  paidOrdersCount: number;
  unfulfilledCount: number;
  creatorOrdersCount: number;
  creatorSales: number;
};

export type StoreOrder = {
  id: string;
  shopifyId: string;
  name: string;
  email: string | null;
  currency: string;
  total: string;
  financialStatus: string;
  fulfillmentStatus: string;
  processedAt: string | null;
  creatorCode: string | null;
  creator?: {
    id: string;
    name: string;
    handle: string | null;
    code: string | null;
  } | null;
  commission?: {
    id: string;
    amount: number;
    rate: number;
    status: "PENDING" | "APPROVED" | "PAID" | "REVERSED";
    linkSlug?: string;
  } | null;
};

export type OrderDetails = {
  id: string;
  shopifyId: string;
  name: string;
  email: string | null;
  currency: string;
  total: string;
  financialStatus: string;
  fulfillmentStatus: string;
  processedAt: string | null;
  creatorCode: string | null;
  shopDomain: string | null;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
    phone?: string;
  } | null;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } | null;
  lineItems: Array<{
    id: string;
    title: string;
    variantTitle?: string | null;
    sku?: string | null;
    quantity: number;
    price: string;
    currency: string;
    total: number;
    imageUrl?: string | null;
  }>;
  attribution: {
    creatorCode: string | null;
    linkSlug: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    customAttributes: Array<{ key?: string; name?: string; value: string }>;
  };
  commission?: {
    id: string;
    amount: number;
    rate: number;
    status: "PENDING" | "APPROVED" | "PAID" | "REVERSED";
    createdAt: string;
    creator?: {
      id: string;
      name: string;
      email: string | null;
      creatorCode: string | null;
      handle: string;
    } | null;
    link?: {
      id: string;
      slug: string;
      commissionRate: string | number;
      targetType: string;
      destinationPath: string;
    } | null;
  } | null;
};

export async function getStoreOrders(
  page = 1,
  options: {
    search?: string;
    financialStatus?: string;
    fulfillmentStatus?: string;
    creatorOnly?: boolean;
  } = {}
) {
  return (
    await apiClient.get<{
      orders: StoreOrder[];
      shopDomain?: string | null;
      summary?: OrderSummary;
      pagination: Pagination;
    }>("/store/orders", {
      params: {
        page,
        limit: 25,
        search: options.search || undefined,
        financialStatus: options.financialStatus || undefined,
        fulfillmentStatus: options.fulfillmentStatus || undefined,
        creatorOnly: options.creatorOnly ? "true" : undefined,
      },
    })
  ).data;
}

export async function getStoreOrderDetails(orderId: string) {
  return (await apiClient.get<{ order: OrderDetails }>(`/store/orders/${orderId}`)).data;
}

export async function updateOrderCommissionStatus(
  orderId: string,
  status: "PENDING" | "APPROVED" | "PAID" | "REVERSED"
) {
  return (
    await apiClient.post<{ ok: boolean; commission: any }>(`/store/orders/${orderId}/commission/status`, { status })
  ).data;
}

export async function syncStoreOrders() {
  return (await apiClient.post<{ synced: number }>("/store/orders/sync")).data;
}

export async function attributeStoreOrder(
  orderId: string,
  payload: { creatorId?: string | null; commissionRate?: number }
) {
  return (
    await apiClient.post<{ ok: boolean; commission: any; creator: any }>(
      `/store/orders/${orderId}/attribute`,
      payload
    )
  ).data;
}

