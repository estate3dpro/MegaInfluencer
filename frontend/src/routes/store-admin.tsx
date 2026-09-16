import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { requireRole } from "@/features/auth/route-guards";

export const Route = createFileRoute("/store-admin")({
  beforeLoad: ({ location }) => requireRole("store-admin", location.href),
  component: () => <AppShell role="store-admin" />,
});
