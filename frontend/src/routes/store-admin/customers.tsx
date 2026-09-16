import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "@/features/store-admin/pages/CommercePages";
export const Route = createFileRoute("/store-admin/customers")({ component: CustomersPage });
