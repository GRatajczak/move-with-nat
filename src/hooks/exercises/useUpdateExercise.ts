import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { exerciseKeys } from "../queryKeys";
import type { ExerciseDto } from "../../interface";
import type { UpdateExerciseCommand } from "../../types/exercises";

async function updateExercise(id: string, command: UpdateExerciseCommand): Promise<ExerciseDto> {
  const response = await fetch(`/api/exercises/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update exercise");
  }

  return response.json();
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, command }: { id: string; command: UpdateExerciseCommand }) => updateExercise(id, command),
    onSuccess: (data, variables) => {
      // Invalidate specific exercise and lists
      queryClient.invalidateQueries({ queryKey: exerciseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });

      toast.success("Ćwiczenie zaktualizowane pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się zaktualizować ćwiczenia");
    },
  });
}
