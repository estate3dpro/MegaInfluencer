import { queryOptions } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/auth/api/auth.api";
import { queryKeys } from "@/lib/query-keys";

export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.auth.currentUser,
    queryFn: getCurrentUser,
    staleTime: 60_000,
  });
