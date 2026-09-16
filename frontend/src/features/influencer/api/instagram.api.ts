import { apiClient } from "@/lib/api/client";

export type InstagramProfileResponse = {
  connection: {
    instagramUserId: string;
    username: string;
    displayName: string | null;
    status: "ACTIVE" | "EXPIRED" | "REVOKED";
    connectedAt: string;
    tokenExpiresAt: string | null;
  };
  profile: {
    id: string;
    username: string;
    name?: string;
    media_count?: number;
    followers_count?: number;
    follows_count?: number;
  };
};

export async function getInstagramProfile() {
  const { data } = await apiClient.get<InstagramProfileResponse>("/influencer/instagram/profile");
  return data;
}
