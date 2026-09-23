import { apiClient } from "@/lib/api/client";

export type Campaign = {
  id: string;
  title: string;
  brief: string;
  category: string;
  imageUrl: string;
  campaignType: string;
  objective: string;
  deliverables: string;
  deliverableDetails?: Record<string, number> | null;
  compensationType: string;
  compensationDetails?: Record<string, string | number | boolean> | null;
  minimumFollowers?: number | null;
  applicationType?: "OPEN" | "APPROVAL_REQUIRED" | "INVITE_ONLY";
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  applicationDeadline: string;
  contentDeadline?: string | null;
  campaignEndDate?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  status: "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED" | "ARCHIVED";
  organization?: { name: string; logoUrl: string | null };
  productId?: string | null;
  product?: { id: string; title: string; imageUrl: string | null; price: string | null } | null;
  applications?: { id: string; status: string }[];
  _count?: { applications: number };
};
export type CampaignInput = {
  title: string;
  brief: string;
  category: string;
  imageUrl: string;
  campaignType: string;
  objective: string;
  deliverables: string;
  deliverableDetails: Record<string, number>;
  compensationType: "FIXED" | "BARTER" | "COMMISSION" | "HYBRID" | "PERFORMANCE" | "NEGOTIABLE";
  compensationDetails: Record<string, string | number | boolean>;
  productId?: string | null;
  minimumFollowers?: number;
  applicationType: "OPEN" | "APPROVAL_REQUIRED" | "INVITE_ONLY";
  budgetMin?: number;
  budgetMax?: number;
  applicationDeadline: string;
  contentDeadline?: string;
  campaignEndDate?: string;
};
export type CampaignApplication = {
  id: string;
  campaignId: string;
  influencerId: string;
  pitch: string;
  proposedRate: number | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  createdAt: string;
  influencer: {
    id: string;
    displayName: string;
    email: string | null;
    instagramConnection?: { username: string } | null;
  };
};
export type CampaignInfluencer = {
  id: string;
  displayName: string;
  email: string | null;
  instagramUsername: string | null;
  assigned: boolean;
};
export type CampaignAssignment = {
  id: string;
  createdAt: string;
  campaign: Campaign;
};
export const getStoreCampaigns = async () =>
  (await apiClient.get<{ items: Campaign[] }>("/store/campaigns")).data.items;
export const createCampaign = async (input: CampaignInput) =>
  (await apiClient.post<{ campaign: Campaign }>("/store/campaigns", input)).data.campaign;
export const getStoreCampaign = async (id: string) =>
  (await apiClient.get<{ campaign: Campaign }>(`/store/campaigns/${id}`)).data.campaign;
export const updateCampaign = async ({ id, input }: { id: string; input: CampaignInput }) =>
  (await apiClient.patch<{ campaign: Campaign }>(`/store/campaigns/${id}`, input)).data.campaign;
export const publishCampaign = async (id: string) =>
  (await apiClient.post<{ campaign: Campaign }>(`/store/campaigns/${id}/publish`)).data.campaign;
export const setCampaignStatus = async ({
  id,
  status,
}: {
  id: string;
  status: "PUBLISHED" | "PAUSED";
}) =>
  (await apiClient.patch<{ campaign: Campaign }>(`/store/campaigns/${id}/status`, { status })).data
    .campaign;
export const deleteCampaign = async (id: string) => apiClient.delete(`/store/campaigns/${id}`);
export const getCampaignInfluencers = async (id: string) =>
  (await apiClient.get<{ influencers: CampaignInfluencer[] }>(`/store/campaigns/${id}/influencers`))
    .data.influencers;
export const assignCampaignInfluencer = async ({
  campaignId,
  influencerId,
}: {
  campaignId: string;
  influencerId: string;
}) => apiClient.post(`/store/campaigns/${campaignId}/assignments`, { influencerId });
export const unassignCampaignInfluencer = async ({
  campaignId,
  influencerId,
}: {
  campaignId: string;
  influencerId: string;
}) => apiClient.delete(`/store/campaigns/${campaignId}/assignments/${influencerId}`);
export const getCampaignApplications = async (id: string) =>
  (await apiClient.get<{ items: CampaignApplication[] }>(`/store/campaigns/${id}/applications`))
    .data.items;
export const decideCampaignApplication = async ({
  campaignId,
  applicationId,
  decision,
}: {
  campaignId: string;
  applicationId: string;
  decision: "accept" | "decline";
}) => apiClient.post(`/store/campaigns/${campaignId}/applications/${applicationId}/${decision}`);
export const getDiscoverCampaigns = async () =>
  (await apiClient.get<{ items: Campaign[] }>("/influencer/discover-campaigns")).data.items;
export const applyCampaign = async (id: string, pitch: string) =>
  apiClient.post(`/influencer/discover-campaigns/${id}/applications`, { pitch });
export const getAssignedCampaigns = async () =>
  (await apiClient.get<{ items: CampaignAssignment[] }>("/influencer/campaigns")).data.items;
