import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/shared/components/WorkspacePage";
import { ChatPage } from "@/features/chat/pages/ChatPage";

export const Route = createFileRoute("/influencer/$page")({
  component: InfluencerPage,
});

function InfluencerPage() {
  const { page } = Route.useParams();
  if (page === "chat") return <ChatPage role="influencer" />;
  return <WorkspacePage role="influencer" page={page} />;
}
