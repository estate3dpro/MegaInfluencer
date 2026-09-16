import { createFileRoute } from "@tanstack/react-router";
import { CommissionsPage } from "@/features/admin/pages/FinancePages";
export const Route = createFileRoute("/admin/commissions")({ component: CommissionsPage });
