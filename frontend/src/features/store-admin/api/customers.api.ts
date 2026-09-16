import { apiClient } from "@/lib/api/client";
import type { Pagination } from "./products.api";

export type StoreCustomer={email:string;orders:number;spent:number;currency:string;lastOrder:string|null};

export async function getStoreCustomers(page = 1) {
  return (await apiClient.get<{ customers: StoreCustomer[]; pagination: Pagination }>("/store/customers", {
    params: { page, limit: 25 },
  })).data;
}
