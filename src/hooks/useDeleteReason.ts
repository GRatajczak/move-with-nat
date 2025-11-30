import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "./queryKeys";

/**
 * Hook for deleting a standard reason
 * @returns Mutation object with mutateAsync function and pending state
 */
export function useDeleteReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/reasons/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete reason");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reasons.all });
      toast.success("Powód został usunięty");
    },
    onError: (error: Error) => {
      toast.error(`Błąd podczas usuwania: ${error.message}`);
    },
  });
}
