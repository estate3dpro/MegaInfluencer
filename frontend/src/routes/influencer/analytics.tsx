import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/influencer/analytics")({
  beforeLoad: () => {
    throw redirect({ to: "/influencer/store" });
  },
  component: () => null,
});
