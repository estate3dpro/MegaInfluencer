import { createFileRoute } from "@tanstack/react-router";
import { InstagramPartnerStudioPage } from "@/features/instagram-partner/pages/InstagramPartnerStudioPage";

export const Route = createFileRoute("/store-admin/instagram-partner")({
  component: () => <InstagramPartnerStudioPage role="store-admin" />,
});
