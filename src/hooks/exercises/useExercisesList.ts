import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
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

export function useExercisesList(initialQuery?: Partial<ListExercisesQuery>) {
  const [search, setSearch] = useState(initialQuery?.search || "");
  const [page, setPage] = useState(initialQuery?.page || 1);
  const limit = initialQuery?.limit || 20;

  // Debounce search query
  const debouncedSearch = useDebounce(search, 300);

  // Build query object
  const query: ListExercisesQuery = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      page,
      limit,
    }),
    [debouncedSearch, page, limit]
  );

  // Fetch exercises
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: exerciseKeys.list(query),
    queryFn: () => fetchExercises(query),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });

  return {
    exercises: data?.data || [],
    pagination: data?.meta,
    isLoading,
    error,
    search,
    setSearch,
    page,
    setPage,
    refetch,
  };
}
