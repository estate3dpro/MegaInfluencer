import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/api-error";

function shouldRetry(failureCount: number, error: unknown) {
  if (isApiError(error) && error.status !== null && error.status < 500 && error.status !== 429) {
    return false;
  }

  return failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: { retry: false },
    },
  });
}
