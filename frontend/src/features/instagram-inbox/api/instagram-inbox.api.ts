import { apiClient } from "@/lib/api/client";

export type InstagramInboxReply = {
  id: string;
  message: string;
  status: "PENDING" | "SENT" | "FAILED";
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  sender: { id: string; displayName: string; role: "INFLUENCER" | "STORE_OWNER" | "ADMIN" };
};

export type InstagramInboxConversation = {
  id: string;
  instagramCommentId: string;
  commenterId: string;
  commenterUsername: string | null;
  commentText: string;
  instagramMediaId: string;
  instagramAccountId: string | null;
  createdAt: string;
  updatedAt: string;
  influencer: {
    id: string;
    displayName: string;
    instagramConnection: { username: string; status: "ACTIVE" | "EXPIRED" | "REVOKED" } | null;
  };
  manualReplies: InstagramInboxReply[];
};

export async function getInstagramInbox() {
  return (await apiClient.get<{ items: InstagramInboxConversation[] }>("/instagram-inbox")).data.items;
}

export async function sendInstagramInboxReply(conversationId: string, message: string) {
  return (
    await apiClient.post<{ reply: InstagramInboxReply }>(
      `/instagram-inbox/${conversationId}/replies`,
      { message },
    )
  ).data.reply;
}
