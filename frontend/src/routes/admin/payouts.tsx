import { createFileRoute } from "@tanstack/react-router";
import { PayoutsPage } from "@/features/admin/pages/FinancePages";
export const Route = createFileRoute("/admin/payouts")({ component: PayoutsPage });
