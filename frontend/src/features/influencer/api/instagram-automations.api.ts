import { apiClient } from "@/lib/api/client";

export type InstagramAutomation = {
  id: string;
  name: string;
  instagramPostId: string;
  postUrl: string | null;
  postLabel: string | null;
  keywords: string[];
  dmMessage: string;
  fallbackMessage: string | null;
  fallbackEnabled: boolean;
  wholeWordMatch: boolean;
  replyToAnyComment: boolean;
  replyOnDuplicateCommentWebhook: boolean;
  status: "ACTIVE" | "PAUSED";
  createdAt: string;
  updatedAt: string;
  deliveryCount: number;
  sentCount: number;
};

export type CreateInstagramAutomationInput = {
  name: string;
  postId: string;
  keywords: string[];
  dmMessage: string;
  fallbackMessage?: string;
  fallbackEnabled?: boolean;
  wholeWordMatch: boolean;
  replyToAnyComment: boolean;
  replyOnDuplicateCommentWebhook: boolean;
};

export type InstagramConnection = {
  id: string;
  instagramUserId: string;
  username: string;
  displayName: string | null;
  tokenExpiresAt: string | null;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  createdAt: string;
  updatedAt: string;
};

export async function getInstagramConnection() {
  const { data } = await apiClient.get<{ connection: InstagramConnection | null }>(
    "/influencer/instagram/connection",
  );
  return data.connection;
}

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

export type UpdateInstagramAutomationInput = {
  name?: string;
  keywords?: string[];
  dmMessage?: string;
  fallbackMessage?: string | null;
  fallbackEnabled?: boolean;
  wholeWordMatch?: boolean;
  replyToAnyComment?: boolean;
  replyOnDuplicateCommentWebhook?: boolean;
  status?: "ACTIVE" | "PAUSED";
};

export type InstagramAutomationDeliveryLog = {
  id: string;
  automationId: string;
  commentId: string;
  attemptKey: string;
  commenterId: string;
  commenterName: string | null;
  commentText: string;
  status: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  fallbackSent: boolean;
  fallbackMessage: string | null;
  fallbackError: string | null;
  fallbackSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  automation?: {
    id: string;
    name: string;
    keywords: string[];
    postLabel: string | null;
    instagramPostId: string;
  };
};

export type InstagramWebhookDeliveryLog = {
  id: string;
  payloadHash: string;
  payload: any;
  receivedAt: string;
};

export type InstagramWebhookLogsResponse = {
  deliveries: InstagramAutomationDeliveryLog[];
  webhookDeliveries: InstagramWebhookDeliveryLog[];
};

export async function createInstagramAutomation(input: CreateInstagramAutomationInput) {
  const { data } = await apiClient.post<{ automation: InstagramAutomation }>(
    "/instagram-automations",
    input,
  );
  return data.automation;
}

export async function updateInstagramAutomation(
  automationId: string,
  input: UpdateInstagramAutomationInput,
) {
  const { data } = await apiClient.patch<{ automation: InstagramAutomation }>(
    `/instagram-automations/${automationId}`,
    input,
  );
  return data.automation;
}

export async function deleteInstagramAutomation(automationId: string) {
  const { data } = await apiClient.delete<{ success: boolean; deletedId: string }>(
    `/instagram-automations/${automationId}`,
  );
  return data;
}

export async function getInstagramWebhookLogs() {
  const { data } = await apiClient.get<InstagramWebhookLogsResponse>(
    "/instagram-automations/webhook-logs",
  );
  return data;
}

