import { createFileRoute } from "@tanstack/react-router";
import { CustomerReferralsPage } from "@/features/store-admin/pages/CustomerReferralsPage";

export const Route = createFileRoute("/store-admin/customer-referrals")({
  component: CustomerReferralsPage,
});
