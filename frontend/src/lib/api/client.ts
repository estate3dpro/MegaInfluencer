import axios from "axios";
import { ApiError, type ApiErrorBody } from "@/lib/api/api-error";
import { useAuthStore } from "@/stores/auth-store";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";
const publicAuthPaths = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/instagram/exchange",
]);

/** The only HTTP client feature modules should use for private API requests. */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  const requestPath = config.url?.split("?")[0];

  if (accessToken && !publicAuthPaths.has(requestPath ?? "")) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError<ApiErrorBody>(error)) {
      return Promise.reject(error);
    }

    const body = error.response?.data;
    const originalRequest = error.config as
      (typeof error.config & { _retriedAfterRefresh?: boolean }) | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retriedAfterRefresh &&
      !publicAuthPaths.has(originalRequest.url?.split("?")[0] ?? "")
    ) {
      const { refreshToken, updateTokens, signOut, user } = useAuthStore.getState();
      if (refreshToken) {
        originalRequest._retriedAfterRefresh = true;
        try {
          const { data } = await apiClient.post<{ accessToken: string; refreshToken: string }>(
            "/auth/refresh",
            { refreshToken },
          );
          updateTokens(data);
          return apiClient.request(originalRequest);
        } catch {
          // The expired refresh session is handled below with one clean redirect.
        }
      }
      signOut();
      if (typeof window !== "undefined") {
        const loginPath =
          user?.activeRole === "admin"
            ? "/admin/login"
            : user?.activeRole === "store-admin"
              ? "/store/login"
              : "/login";
        window.location.assign(
          `${loginPath}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
        );
      }
    }
    return Promise.reject(
      new ApiError({
        status: error.response?.status ?? null,
        code: body?.error?.code ?? error.code ?? "REQUEST_FAILED",
        message: body?.error?.message ?? error.message ?? "Unable to reach the API.",
        requestId: body?.error?.requestId,
      }),
    );
  },
);
