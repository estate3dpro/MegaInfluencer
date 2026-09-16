import { createFileRoute } from "@tanstack/react-router";
import { InfluencersPage } from "@/features/admin/pages/InfluencersPage";

export const Route = createFileRoute("/admin/influencers/")({
  component: InfluencersPage,
});
