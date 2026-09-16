import { createFileRoute, redirect } from "@tanstack/react-router";
import { roleHome } from "@/features/auth/types";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    throw redirect({ to: user ? roleHome[user.activeRole] : "/login" });
  },
});
