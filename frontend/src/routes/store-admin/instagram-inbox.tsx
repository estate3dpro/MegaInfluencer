import { createFileRoute } from "@tanstack/react-router";
import { InstagramInboxPage } from "@/features/instagram-inbox/pages/InstagramInboxPage";

export const Route = createFileRoute("/store-admin/instagram-inbox")({
  component: () => <InstagramInboxPage role="store-admin" />,
});
