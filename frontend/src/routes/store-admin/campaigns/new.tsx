import { createFileRoute } from "@tanstack/react-router";
import { CampaignCreationPage } from "@/features/store-admin/pages/CampaignCreationPage";
export const Route = createFileRoute("/store-admin/campaigns/new")({
  component: CampaignCreationPage,
});
