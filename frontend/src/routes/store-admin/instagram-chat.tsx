import { createFileRoute } from "@tanstack/react-router";
import { InstagramDirectInboxPage } from "@/features/instagram-direct-inbox/pages/InstagramDirectInboxPage";
export const Route = createFileRoute("/store-admin/instagram-chat")({ component: () => <InstagramDirectInboxPage role="store-admin" /> });
