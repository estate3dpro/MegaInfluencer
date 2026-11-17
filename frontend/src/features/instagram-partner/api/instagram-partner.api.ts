import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";
const DEFAULT_PARTNER_API_KEY = "megachat_partner_secret_key";

const partnerClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-api-key": DEFAULT_PARTNER_API_KEY,
  },
});

export interface PartnerAccountStatus {
  connected: boolean;
  username: string | null;
  businessAccountId: string | null;
  profilePictureUrl: string | null;
  activeRulesCount: number;
}

export interface PartnerCommentRule {
  id: string;
  instagramAccountId: string;
  targetPostId: string;
  postCaption?: string | null;
  postThumbnail?: string | null;
  matchType: "ANY" | "EXACT" | "CONTAINS" | "REGEX";
  keywords: string[];
  publicReplies: string[];
  dmMessage: string;
  linkUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerAnalytics {
  summary: {
    totalComments: number;
    matchedComments: number;
    publicRepliesSent: number;
    dmsSent: number;
    deliverySuccessRate: number;
  };
  dailyTrends: Array<{
    date: string;
    comments: number;
    dmsSent: number;
  }>;
  topRules: Array<{
    ruleId: string;
    postCaption: string;
    triggers: number;
  }>;
}

export interface PartnerCommentLog {
  id: string;
  commentId: string;
  commentText: string;
  commenterUsername: string;
  mediaId: string;
  ruleId?: string | null;
  matchedKeyword?: string | null;
  publicReplyStatus: "SUCCESS" | "FAILED" | "SKIPPED";
  publicReplyText?: string | null;
  dmStatus: "SUCCESS" | "FAILED" | "SKIPPED";
  dmError?: string | null;
  createdAt: string;
}

export interface PartnerConversation {
  id: string;
  tenantId: string;
  instagramAccountId: string;
  participantId: string;
  participantUsername: string | null;
  lastMessageAt: string;
  windowExpiresAt: string | null;
  isWindowOpen: boolean;
  totalMessages: number;
  lastMessage?: {
    id: string;
    direction: "INBOUND" | "OUTBOUND";
    messageText: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
    sentAt: string;
  } | null;
}

export interface PartnerMessage {
  id: string;
  instagramMessageId?: string | null;
  direction: "INBOUND" | "OUTBOUND";
  messageText: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  sentAt: string;
}

// -----------------------------------------------------------------------------
// API Calls
// -----------------------------------------------------------------------------

export async function getPartnerAccountStatus(tenantId: string): Promise<PartnerAccountStatus> {
  const { data } = await partnerClient.get<PartnerAccountStatus>("/external/instagram/status", {
    params: { tenantId },
  });
  return data;
}

export async function getPartnerConnectUrl(tenantId: string, redirectUri: string): Promise<{ url: string }> {
  const { data } = await partnerClient.get<{ url: string }>("/external/instagram/connect-url", {
    params: { tenantId, redirectUri },
  });
  return data;
}

export async function connectPartnerAccount(payload: {
  tenantId: string;
  code?: string;
  redirectUri?: string;
  instagramBusinessAccountId?: string;
  username?: string;
  accessToken?: string;
  profilePictureUrl?: string;
}) {
  const { data } = await partnerClient.post("/external/instagram/connect-account", payload);
  return data;
}

export async function getPartnerRules(tenantId: string): Promise<PartnerCommentRule[]> {
  const { data } = await partnerClient.get<{ rules: PartnerCommentRule[] }>("/external/instagram/rules", {
    params: { tenantId },
  });
  return data.rules || [];
}

export async function upsertPartnerRule(payload: {
  tenantId: string;
  ruleId?: string;
  targetPostId: string;
  postCaption?: string;
  postThumbnail?: string;
  matchType: string;
  keywords: string[];
  publicReplies: string[];
  dmMessage: string;
  linkUrl?: string;
  isActive?: boolean;
}) {
  const { data } = await partnerClient.post("/external/instagram/rules", payload);
  return data;
}

export async function deletePartnerRule(tenantId: string, ruleId: string) {
  const { data } = await partnerClient.delete(`/external/instagram/rules/${ruleId}`, {
    params: { tenantId },
  });
  return data;
}

export async function getPartnerAnalytics(tenantId: string, days: number = 30): Promise<PartnerAnalytics> {
  const { data } = await partnerClient.get<PartnerAnalytics>("/external/instagram/analytics", {
    params: { tenantId, days },
  });
  return data;
}

export async function getPartnerLogs(
  tenantId: string,
  page: number = 1,
  limit: number = 25,
  ruleId?: string
): Promise<{ items: PartnerCommentLog[]; total: number; page: number; totalPages: number }> {
  const { data } = await partnerClient.get("/external/instagram/logs", {
    params: { tenantId, page, limit, ruleId },
  });
  return data;
}

export async function getPartnerConversations(
  tenantId: string,
  page: number = 1,
  limit: number = 25,
  search?: string
): Promise<{ items: PartnerConversation[]; total: number; page: number; totalPages: number }> {
  const { data } = await partnerClient.get("/external/instagram/conversations", {
    params: { tenantId, page, limit, search },
  });
  return data;
}

export async function getPartnerConversationMessages(
  tenantId: string,
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<{
  conversation: {
    id: string;
    participantId: string;
    participantUsername: string | null;
    windowExpiresAt: string | null;
    isWindowOpen: boolean;
  };
  messages: PartnerMessage[];
  total: number;
}> {
  const { data } = await partnerClient.get(`/external/instagram/conversations/${conversationId}/messages`, {
    params: { tenantId, page, limit },
  });
  return data;
}

export async function sendPartnerConversationMessage(
  tenantId: string,
  conversationId: string,
  messageText: string,
  mediaUrl?: string,
  useHumanAgentTag?: boolean
) {
  const { data } = await partnerClient.post(`/external/instagram/conversations/${conversationId}/messages`, {
    tenantId,
    messageText,
    mediaUrl,
    useHumanAgentTag,
  });
  return data;
}

export async function sendPartnerDirectMessage(
  tenantId: string,
  recipientId: string,
  messageText: string,
  mediaUrl?: string
) {
  const { data } = await partnerClient.post("/external/instagram/messages/send", {
    tenantId,
    recipientId,
    messageText,
    mediaUrl,
  });
  return data;
}

// -----------------------------------------------------------------------------
// Testing Simulation Helpers
// -----------------------------------------------------------------------------

export async function simulateInboundMessage(
  tenantId: string,
  messageText: string,
  senderUsername?: string,
  senderId?: string
) {
  const { data } = await partnerClient.post("/external/instagram/simulate/message", {
    tenantId,
    messageText,
    senderUsername,
    senderId,
  });
  return data;
}

export async function simulateInboundComment(
  tenantId: string,
  commentText: string,
  commenterUsername?: string,
  mediaId?: string
) {
  const { data } = await partnerClient.post("/external/instagram/simulate/comment", {
    tenantId,
    commentText,
    commenterUsername,
    mediaId,
  });
  return data;
}
