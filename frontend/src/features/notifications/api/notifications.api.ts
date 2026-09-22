import { apiClient } from "@/lib/api/client";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  kind: string;
  link?: string | null;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type GetNotificationsResponse = {
  unreadCount: number;
  notifications: NotificationItem[];
};

export async function getNotifications(filter?: string | { queryKey?: any[] }): Promise<NotificationItem[]> {
  const filterVal = typeof filter === "string" ? filter : "all";
  const params: Record<string, string> = {};
  if (filterVal && filterVal !== "all") params["filter"] = filterVal;

  const res = (
    await apiClient.get<GetNotificationsResponse>("/notifications", {
      params,
    })
  ).data;

  return res.notifications ?? [];
}

export async function getNotificationsWithMeta(filter: string = "all"): Promise<GetNotificationsResponse> {
  const params: Record<string, string> = {};
  if (filter && filter !== "all") params["filter"] = filter;

  return (
    await apiClient.get<GetNotificationsResponse>("/notifications", {
      params,
    })
  ).data;
}

export async function markNotificationRead(id: string): Promise<{ success: boolean }> {
  return (await apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`, {})).data;
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  return (await apiClient.post<{ success: boolean }>("/notifications/read-all", {})).data;
}

export const markNotificationAsRead = markNotificationRead;
export const markAllNotificationsAsRead = markAllNotificationsRead;
