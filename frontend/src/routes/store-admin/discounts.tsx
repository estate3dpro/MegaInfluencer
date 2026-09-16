import { createFileRoute } from "@tanstack/react-router";
import { DiscountsPage } from "@/features/store-admin/pages/CommercePages";
export const Route = createFileRoute("/store-admin/discounts")({ component: DiscountsPage });
