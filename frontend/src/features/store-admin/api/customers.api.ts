import { apiClient } from "@/lib/api/client";
import type { Pagination } from "./products.api";

export type CustomerSummary = {
  totalCustomers: number;
  totalLifetimeRevenue: number;
  repeatCustomerRate: number;
  repeatBuyersCount: number;
  averageCustomerSpend: number;
  creatorAcquiredCustomers: number;
};

export type StoreCustomer = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  location: string | null;
  ordersCount: number;
  lifetimeSpend: number;
  currency: string;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  isRepeatBuyer: boolean;
  attributedCreatorCode: string | null;
  attributedCreatorCodes: string[];
  recentOrders: Array<{
    id: string;
    name: string;
    total: string;
    currency: string;
    processedAt: string | null;
    financialStatus: string | null;
    fulfillmentStatus: string | null;
    creatorCode: string | null;
  }>;
};

export type CustomerDetails = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  shippingAddress: {
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
  ordersCount: number;
  lifetimeSpend: number;
  averageOrderValue: number;
  currency: string;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  attributedCreatorCodes: string[];
  orderHistory: Array<{
    id: string;
    name: string;
    total: string;
    currency: string;
    financialStatus: string;
    fulfillmentStatus: string;
    processedAt: string | null;
    creatorCode: string | null;
    creatorName: string | null;
    itemCount: number;
    items: Array<{
      title: string;
      quantity: number;
      price: string;
    }>;
  }>;
};

export async function getStoreCustomers(
  page = 1,
  options: {
    search?: string;
    filter?: "ALL" | "REPEAT" | "SINGLE";
  } = {}
) {
  return (
    await apiClient.get<{
      customers: StoreCustomer[];
      shopDomain?: string | null;
      summary?: CustomerSummary;
      pagination: Pagination;
    }>("/store/customers", {
      params: {
        page,
        limit: 25,
        search: options.search || undefined,
        filter: options.filter && options.filter !== "ALL" ? options.filter : undefined,
      },
    })
  ).data;
}

export async function getStoreCustomerDetails(customerId: string) {
  return (await apiClient.get<{ customer: CustomerDetails }>(`/store/customers/${customerId}`)).data;
}
