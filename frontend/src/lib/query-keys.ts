/** Centralized keys prevent cache-key collisions between independently built features. */
export const queryKeys = {
  auth: {
    currentUser: ["auth", "current-user"] as const,
  },
  dashboard: {
    influencerOverview: ["dashboard", "influencer-overview"] as const,
    storeOverview: ["dashboard", "store-overview"] as const,
  },
  instagram: {
    profile: ["instagram", "profile"] as const,
  },
  analytics: {
    influencer: (range: string = "30d") => ["analytics", "influencer", range] as const,
  },
  stores: {
    influencerOverview: ["stores", "influencer-overview"] as const,
  },
  products: {
    influencer: (scope: string = "all", search: string = "", campaignId: string = "") =>
      ["products", "influencer", scope, search, campaignId] as const,
  },
  links: {
    influencer: (storeId?: string, search?: string) => ["links", "influencer", storeId ?? "all", search ?? ""] as const,
  },
  orders: {
    influencer: (scope: string = "all", status: string = "all", search: string = "") => ["orders", "influencer", scope, status, search] as const,
  },
  earnings: {
    influencer: (scope: string = "all") => ["earnings", "influencer", scope] as const,
  },
  notifications: {
    list: (filter: string = "all") => ["notifications", "list", filter] as const,
  },
} as const;
