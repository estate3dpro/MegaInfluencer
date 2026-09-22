import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/shared/components/WorkspacePage";
import { ChatPage } from "@/features/chat/pages/ChatPage";

export const Route = createFileRoute("/store-admin/$page")({
  component: StoreAdminPage,
});

function StoreAdminPage() {
  const { page } = Route.useParams();
  if (page === "chat") return <ChatPage role="store-admin" />;
  if (page === "support") return <ChatPage role="store-admin" mode="support" />;
  return <WorkspacePage role="store-admin" page={page} />;
}
