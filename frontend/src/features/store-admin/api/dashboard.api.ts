import { apiClient } from "@/lib/api/client";

export type DashboardMetric = {
  value: number;
  change: number;
};

export type PerformancePoint = {
  date: string;
  day: string;
  sales: number;
  orders: number;
  creatorSales: number;
};

export type RecentOrder = {
  id: string;
  name: string;
  customer: string;
  email: string | null;
  total: number;
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string;
  processedAt: string | null;
  creatorCode: string | null;
};

export type TopCreator = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  orders: number;
  sales: number;
  commission: number;
  color: string;
};

export type StoreDashboardResponse = {
  store: {
    name: string;
    ownerName: string;
    shopDomain: string | null;
    connectionStatus: string;
    totalProducts: number;
  };
  metrics: {
    totalSales: DashboardMetric;
    totalOrders: DashboardMetric;
    creatorSales: DashboardMetric;
    activeCreators: DashboardMetric;
  };
  channelBreakdown: {
    totalSales: number;
    creatorSales: number;
    creatorPercentage: number;
  };
  performance: PerformancePoint[];
  recentOrders: RecentOrder[];
  topCreators: TopCreator[];
};

export async function getStoreDashboard() {
  const response = await apiClient.get<StoreDashboardResponse>("/store/dashboard");
  return response.data;
}
