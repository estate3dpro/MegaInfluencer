import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/features/store-admin/pages/CommercePages";
export const Route = createFileRoute("/store-admin/orders/")({ component: OrdersPage });
