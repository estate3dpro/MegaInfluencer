import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/store-admin/pages/DashboardPage";

export const Route = createFileRoute("/store-admin/dashboard")({
  component: DashboardPage,
});
