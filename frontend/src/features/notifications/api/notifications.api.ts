import { apiClient } from "@/lib/api/client";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  kind: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export const getNotifications = async () =>
  (await apiClient.get<{ items: AppNotification[] }>("/notifications")).data.items;
export const markNotificationRead = async (id: string) =>
  apiClient.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = async () => apiClient.patch("/notifications/read-all");
