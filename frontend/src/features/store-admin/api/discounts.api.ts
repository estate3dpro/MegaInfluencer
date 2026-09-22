import { apiClient } from "@/lib/api/client";

export type DiscountSummary = {
  totalCoupons: number;
  totalRedemptions: number;
  totalCustomerSavings: number;
  creatorCodeRevenue: number;
};

export type StoreDiscount = {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  currency: string;
  status: "ACTIVE" | "EXPIRED" | "DISABLED";
  isCreatorCode: boolean;
  creator: {
    id: string;
    name: string;
    handle: string;
    code: string;
  } | null;
  startsAt: string | null;
  expiresAt: string | null;
  usageCount: number;
  totalSales: number;
  totalSavings: number;
  isCustom: boolean;
};

export type AvailableCreator = {
  id: string;
  displayName: string;
  creatorCode: string | null;
  instagramUsername: string | null;
};

export async function getStoreDiscounts(options: { search?: string; status?: string } = {}) {
  return (
    await apiClient.get<{
      discounts: StoreDiscount[];
      availableCreators: AvailableCreator[];
      shopDomain?: string | null;
      summary: DiscountSummary;
    }>("/store/discounts", { params: options })
  ).data;
}

export async function createStoreDiscount(data: {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  creatorId?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
}) {
  return (await apiClient.post<{ ok: boolean; discount: any }>("/store/discounts", data)).data;
}

export async function updateStoreDiscount(
  discountId: string,
  data: { status?: "ACTIVE" | "DISABLED" | "EXPIRED"; expiresAt?: string }
) {
  return (await apiClient.patch<{ ok: boolean }>(`/store/discounts/${discountId}`, data)).data;
}

export async function deleteStoreDiscount(discountId: string) {
  return (await apiClient.delete<{ ok: boolean }>(`/store/discounts/${discountId}`)).data;
}
