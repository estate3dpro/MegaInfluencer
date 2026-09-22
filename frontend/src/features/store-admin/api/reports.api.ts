import { apiClient } from "@/lib/api/client";

export type ReportsSummaryResponse = {
  storeName: string;
  shopDomain: string | null;
  sales: {
    totalGMV: number;
    totalOrders: number;
    avgOrderValue: number;
    creatorAttributedGMV: number;
    totalCommissions: number;
    attributedOrderCount: number;
  };
  inventory: {
    totalProducts: number;
    totalUnits: number;
    lowStockCount: number;
  };
  creators: {
    totalPartners: number;
    activeCommissionsCount: number;
  };
  customers: {
    uniqueCustomerCount: number;
  };
};

export async function getStoreReportsSummary() {
  return (await apiClient.get<ReportsSummaryResponse>("/store/reports/summary")).data;
}
