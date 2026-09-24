import { apiClient } from "@/lib/api/client";

export type InstagramProfileResponse = {
  creatorCode: string | null;
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

export type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp?: string;
  permalink?: string;
};

export async function getInstagramProfile() {
  const { data } = await apiClient.get<InstagramProfileResponse>("/influencer/instagram/profile");
  return data;
}

export async function startInstagramConnection() {
  const { data } = await apiClient.post<{ authorizationUrl: string }>("/influencer/instagram/connect");
  return data.authorizationUrl;
}

export async function getInstagramPosts() {
  const { data } = await apiClient.get<{ items: InstagramMedia[] }>("/influencer/instagram/posts", {
    params: { limit: 50 },
  });
  return data.items;
}
