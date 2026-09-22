import { apiClient } from "@/lib/api/client";

export type InfluencerOrder = {
  id: string;
  orderId: string;
  orderNumber: string;
  customer: string;
  store: string;
  storeSlug: string;
  productTitle: string;
  orderTotal: string;
  orderTotalRaw: number;
  commission: string;
  commissionRaw: number;
  commissionRate: string;
  status: "Approved" | "Pending" | "Paid" | "Cancelled";
  statusRaw: "APPROVED" | "PENDING" | "PAID" | "REVERSED";
  date: string;
  createdAt: string;
};

export type GetInfluencerOrdersResponse = {
  metrics: {
    totalOrders: number;
    totalSales: string;
    totalCommissions: string;
  };
  orders: InfluencerOrder[];
};

export async function getInfluencerOrders(
  scope: string = "all",
  status: string = "all",
  search: string = ""
): Promise<GetInfluencerOrdersResponse> {
  const params: Record<string, string> = {};
  if (scope && scope !== "all") params.scope = scope;
  if (status && status !== "all") params.status = status;
  if (search) params.search = search;

  return (
    await apiClient.get<GetInfluencerOrdersResponse>("/influencer/orders", {
      params,
    })
  ).data;
}
