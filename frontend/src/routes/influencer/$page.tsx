import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/shared/components/WorkspacePage";

export const Route = createFileRoute("/influencer/$page")({
  component: InfluencerPage,
});

function InfluencerPage() {
  const { page } = Route.useParams();
  return <WorkspacePage role="influencer" page={page} />;
}
