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
} as const;
