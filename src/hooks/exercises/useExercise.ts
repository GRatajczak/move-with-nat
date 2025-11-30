import { useQuery } from "@tanstack/react-query";
import { exerciseKeys } from "../queryKeys";
import type { ExerciseViewModel } from "../../interface";

async function fetchExercise(id: string): Promise<ExerciseViewModel> {
  const response = await fetch(`/api/exercises/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Exercise not found");
    }
    throw new Error("Failed to fetch exercise");
  }

  return response.json();
}

export function useExercise(exerciseId: string | null) {
  return useQuery({
    queryKey: exerciseId ? exerciseKeys.detail(exerciseId) : ["exercise", "null"],
    queryFn: () => fetchExercise(exerciseId ?? ""),
    enabled: !!exerciseId, // Only fetch if ID exists
  });
}
