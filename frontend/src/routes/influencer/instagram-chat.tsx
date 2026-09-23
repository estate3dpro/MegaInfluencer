import { createFileRoute } from "@tanstack/react-router";
import { InstagramDirectInboxPage } from "@/features/instagram-direct-inbox/pages/InstagramDirectInboxPage";
export const Route = createFileRoute("/influencer/instagram-chat")({ component: () => <InstagramDirectInboxPage role="influencer" /> });
