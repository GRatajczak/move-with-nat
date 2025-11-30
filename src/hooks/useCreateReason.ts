import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "./queryKeys";
import type { CreateReasonFormData, ReasonViewModel } from "@/interface";

/**
 * Hook for creating a new standard reason
 * @returns Mutation object with mutateAsync function and pending state
 */
export function useCreateReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReasonFormData): Promise<ReasonViewModel> => {
      const response = await fetch("/api/reasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create reason");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reasons.all });
      toast.success("Powód został utworzony");
    },
    onError: (error: Error) => {
      toast.error(`Błąd podczas tworzenia: ${error.message}`);
    },
  });
}
