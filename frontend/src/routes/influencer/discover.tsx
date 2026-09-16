import { createFileRoute } from "@tanstack/react-router";
import { DiscoverPage } from "@/features/influencer/pages/DiscoverPage";

export const Route = createFileRoute("/influencer/discover")({
  component: DiscoverPage,
});
