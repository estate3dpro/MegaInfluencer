import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/influencer/campaigns")({
  component: Outlet,
});
