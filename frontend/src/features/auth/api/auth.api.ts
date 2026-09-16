import { apiClient } from "@/lib/api/client";
import type { AuthUser, Role } from "@/features/auth/types";

export type ApiUserRole = "ADMIN" | "STORE_OWNER" | "INFLUENCER";

export type ApiUser = {
  id: string;
  email: string | null;
  displayName: string;
  role: ApiUserRole;
  status: "ACTIVE" | "SUSPENDED";
};

export type LoginInput = { email: string; password: string };
export type LoginResponse = { accessToken: string; refreshToken: string; user: ApiUser };

const apiRoleToAppRole: Record<ApiUserRole, Role> = {
  ADMIN: "admin",
  STORE_OWNER: "store-admin",
  INFLUENCER: "influencer",
};

export function toAuthUser(user: ApiUser): AuthUser {
  const role = apiRoleToAppRole[user.role];
  return {
    id: user.id,
    email: user.email ?? "",
    name: user.displayName,
    roles: [role],
    activeRole: role,
  };
}

export async function login(input: LoginInput) {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", input);
  return data;
}

export async function exchangeInstagramLoginTicket(code: string) {
  const { data } = await apiClient.post<LoginResponse>("/auth/instagram/exchange", { code });
  return data;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<{ user: ApiUser }>("/me");
  return data.user;
}
