import { createFileRoute } from "@tanstack/react-router";

import { CampaignCreationPage } from "@/features/store-admin/pages/CampaignCreationPage";

export const Route = createFileRoute("/store-admin/campaigns/$campaignId/edit")({
  component: EditCampaignPage,
});

function EditCampaignPage() {
  const { campaignId } = Route.useParams();
  return <CampaignCreationPage campaignId={campaignId} />;
}
