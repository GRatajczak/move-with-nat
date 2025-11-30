import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { exerciseKeys } from "../queryKeys";

async function deleteExercise(id: string, hard: boolean): Promise<void> {
  const url = `/api/exercises/${id}${hard ? "?hard=true" : ""}`;
  const response = await fetch(url, { method: "DELETE" });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete exercise");
  }
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hard }: { id: string; hard: boolean }) => deleteExercise(id, hard),
    onSuccess: (_, variables) => {
      // Invalidate lists (exercise removed/hidden)
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });

      // Remove from cache
      queryClient.removeQueries({ queryKey: exerciseKeys.detail(variables.id) });

      const message = variables.hard ? "Ćwiczenie usunięte trwale" : "Ćwiczenie ukryte pomyślnie";
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się usunąć ćwiczenia");
    },
  });
}
