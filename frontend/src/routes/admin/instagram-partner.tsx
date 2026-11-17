import { createFileRoute } from "@tanstack/react-router";
import { InstagramPartnerStudioPage } from "@/features/instagram-partner/pages/InstagramPartnerStudioPage";

export const Route = createFileRoute("/admin/instagram-partner")({
  component: () => <InstagramPartnerStudioPage role="admin" />,
});
