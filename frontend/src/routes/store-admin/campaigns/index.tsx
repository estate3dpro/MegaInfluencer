import { createFileRoute } from "@tanstack/react-router";
import { CampaignMarketplacePage } from "@/features/store-admin/pages/CampaignMarketplacePage";

export const Route = createFileRoute("/store-admin/campaigns/")({
  component: CampaignMarketplacePage,
});
