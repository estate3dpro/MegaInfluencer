import { createFileRoute } from "@tanstack/react-router";
import { CampaignsPage } from "@/features/influencer/pages/CampaignsPage";

export const Route = createFileRoute("/influencer/campaigns/")({
  component: CampaignsPage,
});
