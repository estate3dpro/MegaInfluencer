import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/influencer/instagram-automation")({
  component: Outlet,
});
