import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "@/features/chat/pages/ChatPage";

export const Route = createFileRoute("/influencer/support")({
  component: () => <ChatPage role="influencer" mode="support" />,
});
