import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { InstagramLoginPage } from "@/features/auth/components/LoginPage";
import { roleHome } from "@/features/auth/types";
import { useAuthStore } from "@/stores/auth-store";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
  instagramLoginCode: z.string().min(20).optional(),
  error: z.string().optional(),
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
  const { instagramLoginCode, error } = Route.useSearch();
  return <InstagramLoginPage loginCode={instagramLoginCode} oauthError={error} />;
}
