import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/features/admin/pages/AnalyticsPage";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});
