import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/shared/components/WorkspacePage";
import { ChatPage } from "@/features/chat/pages/ChatPage";

export const Route = createFileRoute("/admin/$page")({
  component: AdminPage,
});

function AdminPage() {
  const { page } = Route.useParams();
  if (page === "chat") return <ChatPage role="admin" />;
  return <WorkspacePage role="admin" page={page} />;
}
