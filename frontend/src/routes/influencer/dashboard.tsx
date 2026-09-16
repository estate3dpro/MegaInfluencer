import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/influencer/pages/DashboardPage";

export const Route = createFileRoute("/influencer/dashboard")({
  component: DashboardPage,
});
