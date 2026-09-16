import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/features/admin/pages/FinancePages";
export const Route = createFileRoute("/admin/orders")({ component: OrdersPage });
