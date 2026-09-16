import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { requireRole } from "@/features/auth/route-guards";

export const Route = createFileRoute("/influencer")({
  beforeLoad: ({ location }) => requireRole("influencer", location.href),
  component: () => <AppShell role="influencer" />,
});
