import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/features/store-admin/pages/ReportsPage";

export const Route = createFileRoute("/store-admin/reports")({ component: ReportsPage });
