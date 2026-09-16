import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/features/store-admin/pages/AnalyticsPage";

export const Route = createFileRoute("/store-admin/analytics")({ component: AnalyticsPage });
