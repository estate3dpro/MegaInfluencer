import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { requireRole } from "@/features/auth/route-guards";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ location }) => {
    if (location.pathname !== "/admin/login") {
      return requireRole("admin", location.href);
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname === "/admin/login" ? <Outlet /> : <AppShell role="admin" />;
}
