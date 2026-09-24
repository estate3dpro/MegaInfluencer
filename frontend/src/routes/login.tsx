import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { CredentialLoginPage } from "@/features/auth/components/LoginPage";
import { roleHome } from "@/features/auth/types";
import { useAuthStore } from "@/stores/auth-store";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (user) {
      throw redirect({ to: roleHome[user.activeRole] });
    }
  },
  component: LoginRoute,
});

function LoginRoute() {
  return <CredentialLoginPage role="influencer" redirectTo={Route.useSearch().redirect} />;
}
