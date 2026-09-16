import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/features/influencer/pages/CommercePages";
export const Route = createFileRoute("/influencer/orders")({ component: OrdersPage });
