import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "@/features/chat/pages/ChatPage";

export const Route = createFileRoute("/admin/support")({
  component: () => <ChatPage role="admin" mode="support" />,
});
