import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/features/influencer/pages/AnalyticsPage";

export const Route = createFileRoute("/influencer/analytics")({
  component: AnalyticsPage,
});
