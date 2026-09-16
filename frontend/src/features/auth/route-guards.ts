import { redirect } from "@tanstack/react-router";
import { roleHome, type Role } from "@/features/auth/types";
import { useAuthStore } from "@/stores/auth-store";

export function requireRole(role: Role, currentPath: string) {
  // Auth is currently persisted in browser localStorage. During SSR there is no
  // localStorage to hydrate, so defer this client-side guard until the browser
  // can read the existing session.
  if (typeof window === "undefined") {
    return;
  }

  const { user, hasRole } = useAuthStore.getState();

  if (!user) {
    throw redirect({ to: "/login", search: { redirect: currentPath } });
  }

  if (!hasRole(role)) {
    throw redirect({ to: roleHome[user.activeRole] });
  }
}

export function requireAuthenticated(currentPath: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const { user } = useAuthStore.getState();
  if (!user) {
    throw redirect({ to: "/login", search: { redirect: currentPath } });
  }

  return user;
}
