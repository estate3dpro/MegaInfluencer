import { createFileRoute } from "@tanstack/react-router";
import { InfluencerDetailsPage } from "@/features/admin/pages/InfluencerDetailsPage";

export const Route = createFileRoute("/admin/influencers/$influencerId")({
  component: InfluencerDetailsRoute,
});
function InfluencerDetailsRoute() {
  return <InfluencerDetailsPage influencerId={Route.useParams().influencerId} />;
}
