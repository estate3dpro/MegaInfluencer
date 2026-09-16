import { createFileRoute } from "@tanstack/react-router";
import { CampaignDetailsPage } from "@/features/influencer/pages/CampaignsPage";
export const Route = createFileRoute("/influencer/campaigns/$campaignId")({ component: () => <CampaignDetailsPage campaignId={Route.useParams().campaignId} /> });
