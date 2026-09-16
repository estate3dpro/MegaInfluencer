import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/influencer/pages/SupportPages";
export const Route = createFileRoute("/influencer/notifications")({ component: NotificationsPage });
