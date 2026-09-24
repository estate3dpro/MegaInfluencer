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
export type InfluencerRegistrationInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
};
export type StoreRegistrationInput = {
  businessName: string;
  email: string;
  password: string;
};
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

export async function registerInfluencer(input: InfluencerRegistrationInput) {
  const { data } = await apiClient.post<{ user: ApiUser }>("/auth/register", {
    ...input,
    displayName: `${input.firstName.trim()} ${input.lastName.trim()}`,
    role: "INFLUENCER",
  });
  return data.user;
}

export async function registerStoreOwner(input: StoreRegistrationInput) {
  const { data } = await apiClient.post<{ user: ApiUser }>("/auth/register", {
    email: input.email,
    password: input.password,
    displayName: input.businessName.trim(),
    role: "STORE_OWNER",
  });
  return data.user;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<{ user: ApiUser }>("/me");
  return data.user;
}
