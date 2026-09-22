import { apiClient } from "@/lib/api/client";

export type AdminDashboardData = {
  metrics: {
    activeInfluencers: number;
    totalInfluencers: number;
    activeStores: number;
    totalStores: number;
    platformGMV: number;
    totalOrdersCount: number;
    totalCommissions: number;
    pendingReviews: number;
  };
  monthlyPerformance: {
    month: string;
    value: number;
    orders: number;
  }[];
  activities: {
    title: string;
    detail: string;
    time: string;
    tone: string;
  }[];
  reviewQueue: {
    id: string;
    name: string;
    type: string;
    requested: string;
    status: string;
  }[];
};

export type AdminOrder = {
  id: string;
  name: string;
  storeName: string;
  storeId?: string;
  customerEmail: string;
  total: number;
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string;
  processedAt: string;
  creatorCode: string | null;
  creatorName: string | null;
  commissionAmount: number;
  commissionStatus: string | null;
};

export type AdminCommission = {
  id: string;
  orderId: string;
  orderNumber: string;
  storeName: string;
  orderAmount: number;
  commissionRate: number;
  amount: number;
  status: string;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string | null;
    code: string | null;
    instagram: string | null;
  } | null;
};

export type AdminProduct = {
  id: string;
  title: string;
  handle: string | null;
  storeName: string;
  storeId?: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  vendor: string | null;
  inventoryTotal: number;
  assignedCreatorsCount: number;
  activeLinksCount: number;
  syncedAt: string;
};

export type AdminCampaign = {
  id: string;
  title: string;
  brief: string;
  category: string;
  imageUrl: string;
  campaignType: string;
  status: string;
  storeName: string;
  storeId?: string;
  budgetMin: number | null;
  budgetMax: number | null;
  compensationType: string;
  deliverables: string;
  applicationDeadline: string;
  applicationsCount: number;
  assignedCreatorsCount: number;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  creatorCode: string | null;
  instagramUsername: string | null;
  storeName: string | null;
  createdAt: string;
};

export type AdminSocialAccount = {
  id: string;
  influencerId: string;
  influencerName: string;
  influencerEmail: string | null;
  creatorCode: string | null;
  username: string;
  status: string;
  tokenExpiresAt: string | null;
  syncedAt: string;
};

export type AdminAnalyticsData = {
  overview: {
    totalPlatformGMV: number;
    creatorAttributedGMV: number;
    totalCommissionsPaid: number;
    totalOrdersCount: number;
    attributedOrdersCount: number;
    totalClicksCount: number;
    conversionRate: number;
  };
  placements: {
    channel: string;
    share: number;
    gmv: number;
  }[];
};

export async function getAdminDashboard() {
  return (await apiClient.get<AdminDashboardData>("/admin/dashboard")).data;
}

export async function getAdminOrders(params?: { search?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "ALL") query.set("status", params.status);
  const qStr = query.toString();
  return (await apiClient.get<{ orders: AdminOrder[]; total: number; totalGMV: number }>(`/admin/orders${qStr ? `?${qStr}` : ""}`)).data;
}

export async function getAdminCommissions(params?: { search?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "ALL") query.set("status", params.status);
  const qStr = query.toString();
  return (await apiClient.get<{ commissions: AdminCommission[]; metrics: any }>(`/admin/commissions${qStr ? `?${qStr}` : ""}`)).data;
}

export async function getAdminProducts(params?: { search?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  const qStr = query.toString();
  return (await apiClient.get<{ products: AdminProduct[]; totalProducts: number }>(`/admin/products${qStr ? `?${qStr}` : ""}`)).data;
}

export async function getAdminCampaigns(params?: { search?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "ALL") query.set("status", params.status);
  const qStr = query.toString();
  return (await apiClient.get<{ campaigns: AdminCampaign[]; totalCampaigns: number; liveCount: number }>(`/admin/campaigns${qStr ? `?${qStr}` : ""}`)).data;
}

export async function getAdminUsers(params?: { search?: string; role?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.role && params.role !== "ALL") query.set("role", params.role);
  const qStr = query.toString();
  return (await apiClient.get<{ users: AdminUser[]; metrics: any }>(`/admin/users${qStr ? `?${qStr}` : ""}`)).data;
}

export async function getAdminSocial(params?: { search?: string }) {
  return (await apiClient.get<{ accounts: AdminSocialAccount[]; metrics: any }>("/admin/social")).data;
}

export async function getAdminAnalytics() {
  return (await apiClient.get<AdminAnalyticsData>("/admin/analytics")).data;
}

export async function updateUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
  return (await apiClient.patch<{ user: any }>(`/admin/users/${userId}/status`, { status })).data;
}

export async function updateAdminCommissionStatus(commissionId: string, status: "PENDING" | "APPROVED" | "PAID" | "REVERSED") {
  return (await apiClient.patch<{ ok: boolean; commission: any }>(`/store/commissions/${commissionId}/status`, { status })).data;
}
