import { apiClient } from "@/lib/api/client";

export type InquiryStatus = "NEW" | "IN_REVIEW" | "RESOLVED" | "ARCHIVED";

export interface ContactInquiry {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InquiriesResponse {
  items: ContactInquiry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    NEW: number;
    IN_REVIEW: number;
    RESOLVED: number;
    ARCHIVED: number;
    ALL: number;
  };
}

export interface SubmitInquiryInput {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitContactInquiry(input: SubmitInquiryInput) {
  return (await apiClient.post<{ success: boolean; data: { id: string } }>("/contact", input)).data;
}

export async function getAdminInquiries(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: InquiryStatus;
}) {
  return (await apiClient.get<InquiriesResponse>("/admin/inquiries", { params })).data;
}

export async function getAdminInquiryById(id: string) {
  return (await apiClient.get<{ inquiry: ContactInquiry }>(`/admin/inquiries/${id}`)).data.inquiry;
}

export async function updateAdminInquiry(
  id: string,
  input: { status?: InquiryStatus; adminNotes?: string | null }
) {
  return (
    await apiClient.patch<{ success: boolean; inquiry: ContactInquiry }>(
      `/admin/inquiries/${id}`,
      input
    )
  ).data.inquiry;
}

export async function deleteAdminInquiry(id: string) {
  return (await apiClient.delete<{ success: boolean }>(`/admin/inquiries/${id}`)).data;
}
