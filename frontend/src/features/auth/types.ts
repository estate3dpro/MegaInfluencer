export const roles = ["influencer", "store-admin", "admin"] as const;

export type Role = (typeof roles)[number];

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  activeRole: Role;
};

export const roleHome: Record<
  Role,
  "/influencer/dashboard" | "/store-admin/dashboard" | "/admin/dashboard"
> = {
  influencer: "/influencer/dashboard",
  "store-admin": "/store-admin/dashboard",
  admin: "/admin/dashboard",
};
