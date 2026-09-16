import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CredentialLoginPage } from "@/features/auth/components/LoginPage";

export const Route = createFileRoute("/admin/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: AdminLoginRoute,
});

function AdminLoginRoute() {
  return <CredentialLoginPage role="admin" redirectTo={Route.useSearch().redirect} />;
}
