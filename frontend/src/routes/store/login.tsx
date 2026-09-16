import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CredentialLoginPage } from "@/features/auth/components/LoginPage";

export const Route = createFileRoute("/store/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: StoreLoginRoute,
});

function StoreLoginRoute() {
  return <CredentialLoginPage role="store-admin" redirectTo={Route.useSearch().redirect} />;
}
