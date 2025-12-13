import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { exerciseKeys } from "../queryKeys";
import { parseErrorResponse } from "../../lib/api-helpers";
import type { CreateExerciseCommand, ExerciseDto } from "../../interface";

async function createExercise(command: CreateExerciseCommand): Promise<ExerciseDto> {
  const response = await fetch("/api/exercises", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  return response.json();
}

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: CreateExerciseCommand) => createExercise(command),
    onSuccess: () => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });

      // Show success toast
      toast.success("Ćwiczenie utworzone pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się utworzyć ćwiczenia");
    },
  });
}
