import { apiClient } from "@/lib/api/client";

export type InstagramDirectConversation = {
  id: string;
  instagramParticipantId: string;
  participantUsername: string | null;
  lastMessageAt: string;
  influencer: { id: string; displayName: string; instagramConnection: { username: string } | null };
  messages: Array<{ id: string; direction: "INBOUND" | "OUTBOUND"; messageText: string; sentAt: string; sender: { displayName: string } | null }>;
};
export const getInstagramDirectInbox = async () => (await apiClient.get<{ items: InstagramDirectConversation[] }>("/instagram-direct-inbox")).data.items;
export const sendInstagramDirectInboxMessage = async (conversationId: string, message: string) => (await apiClient.post(`/instagram-direct-inbox/${conversationId}/messages`, { message })).data;
