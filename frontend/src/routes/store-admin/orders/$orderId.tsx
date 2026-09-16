import { createFileRoute } from "@tanstack/react-router";
import { OrderDetailsPage } from "@/features/store-admin/pages/OrderDetailsPage";
export const Route = createFileRoute("/store-admin/orders/$orderId")({ component: OrderDetailsPage });
