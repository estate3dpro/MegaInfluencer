import { createFileRoute } from "@tanstack/react-router";
import { FinanceOverviewPage } from "@/features/admin/pages/FinancePages";
export const Route = createFileRoute("/admin/finance")({ component: FinanceOverviewPage });
