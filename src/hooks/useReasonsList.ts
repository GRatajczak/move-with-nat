import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "./queryKeys";
import type { ReasonViewModel, PaginatedResponse } from "@/interface";

/**
 * Hook for fetching the list of all standard reasons
 * @returns Query result with reasons array, loading state, error state, and refetch function
 */
export function useReasonsList() {
  const query = useQuery({
    queryKey: QUERY_KEYS.reasons.all,
    queryFn: async (): Promise<ReasonViewModel[]> => {
      const response = await fetch("/api/reasons", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch reasons");
      }

      const result: PaginatedResponse<ReasonViewModel> = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    reasons: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
