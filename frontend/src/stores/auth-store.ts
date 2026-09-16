import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser, Role } from "@/features/auth/types";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  updateTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  signOut: () => void;
  setActiveRole: (role: Role) => void;
  hasRole: (role: Role) => boolean;
};

/**
 * Client-side session state. The API client reads this store to attach the JWT.
 * Before production, move session storage to secure HTTP-only cookies if the
 * backend authentication model supports it.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      updateTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      signOut: () => set({ user: null, accessToken: null, refreshToken: null }),
      setActiveRole: (role) => {
        const user = get().user;
        if (user?.roles.includes(role)) {
          set({ user: { ...user, activeRole: role } });
        }
      },
      hasRole: (role) => get().user?.roles.includes(role) ?? false,
    }),
    {
      name: "mega-influencer-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
