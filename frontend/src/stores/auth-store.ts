import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser, Role } from "@/features/auth/types";

export type ImpersonationBackup = {
  adminUser: AuthUser;
  adminAccessToken: string;
  adminRefreshToken: string;
  storeName?: string;
  targetCreatorId?: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  impersonation: ImpersonationBackup | null;
  setSession: (session: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  updateTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  startImpersonation: (session: {
    influencerUser: AuthUser;
    accessToken: string;
    refreshToken: string;
    storeName?: string;
    targetCreatorId?: string;
  }) => void;
  exitImpersonation: () => ImpersonationBackup | null;
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
      impersonation: null,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      updateTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      startImpersonation: ({ influencerUser, accessToken, refreshToken, storeName, targetCreatorId }) => {
        const current = get();
        if (!current.user || !current.accessToken || !current.refreshToken) return;
        const backup: ImpersonationBackup = current.impersonation || {
          adminUser: current.user,
          adminAccessToken: current.accessToken,
          adminRefreshToken: current.refreshToken,
          storeName,
          targetCreatorId,
        };
        set({
          user: influencerUser,
          accessToken,
          refreshToken,
          impersonation: backup,
        });
      },
      exitImpersonation: () => {
        const current = get();
        const backup = current.impersonation;
        if (!backup) return null;
        set({
          user: backup.adminUser,
          accessToken: backup.adminAccessToken,
          refreshToken: backup.adminRefreshToken,
          impersonation: null,
        });
        return backup;
      },
      signOut: () => set({ user: null, accessToken: null, refreshToken: null, impersonation: null }),
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
        impersonation: state.impersonation,
      }),
    },
  ),
);
