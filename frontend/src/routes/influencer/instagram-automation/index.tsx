import { createFileRoute } from "@tanstack/react-router";
import { InstagramAutomationPage } from "@/features/influencer/pages/InstagramAutomationPage";

export const Route = createFileRoute("/influencer/instagram-automation/")({
  component: InstagramAutomationPage,
});
