import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/influencer/")({
  beforeLoad: () => {
    throw redirect({ to: "/influencer/dashboard" });
  },
});
