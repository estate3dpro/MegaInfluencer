import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/admin/pages/DashboardPage";

export const Route = createFileRoute("/admin/dashboard")({
  component: DashboardPage,
});
