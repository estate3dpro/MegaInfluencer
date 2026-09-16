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
} as const;
