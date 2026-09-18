import { apiClient } from "@/lib/api/client";

export type InstagramAutomation = {
  id: string;
  name: string;
  instagramPostId: string;
  postUrl: string | null;
  postLabel: string | null;
  keywords: string[];
  dmMessage: string;
  wholeWordMatch: boolean;
  status: "ACTIVE" | "PAUSED";
  createdAt: string;
  updatedAt: string;
};

export type CreateInstagramAutomationInput = {
  name: string;
  postId: string;
  keywords: string[];
  dmMessage: string;
  wholeWordMatch: boolean;
};

export async function getInstagramAutomations() {
  const { data } = await apiClient.get<{ items: InstagramAutomation[] }>("/instagram-automations");
  return data.items;
}

export async function getInstagramAutomation(automationId: string) {
  const { data } = await apiClient.get<{ automation: InstagramAutomation }>(
    `/instagram-automations/${automationId}`,
  );
  return data.automation;
}

export async function createInstagramAutomation(input: CreateInstagramAutomationInput) {
  const { data } = await apiClient.post<{ automation: InstagramAutomation }>(
    "/instagram-automations",
    input,
  );
  return data.automation;
}
