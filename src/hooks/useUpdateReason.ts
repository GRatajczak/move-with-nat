import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "./queryKeys";
import type { UpdateReasonFormData, ReasonViewModel } from "@/interface";

/**
 * Hook for updating an existing standard reason
 * @returns Mutation object with mutateAsync function and pending state
 */
export function useUpdateReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReasonFormData }): Promise<ReasonViewModel> => {
      const response = await fetch(`/api/reasons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update reason");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reasons.all });
      toast.success("Powód został zaktualizowany");
    },
    onError: (error: Error) => {
      toast.error(`Błąd podczas aktualizacji: ${error.message}`);
    },
  });
}
