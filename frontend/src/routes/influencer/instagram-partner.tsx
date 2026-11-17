import { createFileRoute } from "@tanstack/react-router";
import { InstagramPartnerStudioPage } from "@/features/instagram-partner/pages/InstagramPartnerStudioPage";

export const Route = createFileRoute("/influencer/instagram-partner")({
  component: () => <InstagramPartnerStudioPage role="influencer" />,
});
