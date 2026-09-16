import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/features/admin/pages/GovernancePages";
export const Route = createFileRoute("/admin/reports")({ component: ReportsPage });
