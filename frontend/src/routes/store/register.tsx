import { createFileRoute, redirect } from "@tanstack/react-router";
import { StoreRegistrationPage } from "@/features/auth/components/LoginPage";
import { roleHome } from "@/features/auth/types";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/store/register")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (user) throw redirect({ to: roleHome[user.activeRole] });
  },
  component: StoreRegistrationPage,
});
