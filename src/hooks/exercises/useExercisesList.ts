import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useDebounce } from "../useDebounce";
import { exerciseKeys } from "../queryKeys";
import type { ListExercisesQuery, PaginatedResponse, ExerciseViewModel } from "../../interface";

async function fetchExercises(query: ListExercisesQuery): Promise<PaginatedResponse<ExerciseViewModel>> {
  const params = new URLSearchParams();
  if (query.search) params.append("search", query.search);
  params.append("page", query.page?.toString() || "1");
  params.append("limit", query.limit?.toString() || "20");

  const response = await fetch(`/api/exercises?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch exercises");
  }

  return response.json();
}

export function useExercisesList(initialQuery?: ListExercisesQuery) {
  const debouncedSearch = useDebounce(initialQuery?.search || "", 300);

  const query: ListExercisesQuery = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      page: initialQuery?.page || 1,
      limit: initialQuery?.limit || 20,
    }),
    [debouncedSearch, initialQuery?.page, initialQuery?.limit]
  );

  const { data, isLoading, error } = useQuery({
    queryKey: exerciseKeys.list(query),
    queryFn: () => fetchExercises(query),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });

  return {
    exercises: data?.data || [],
    pagination: data?.meta,
    isLoading,
    error,
  };
}
