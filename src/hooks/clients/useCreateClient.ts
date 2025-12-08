import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserDto, CreateClientCommand } from "@/interface";
import { clientsKeys } from "../queryKeys";

async function createClient(command: CreateClientCommand): Promise<UserDto> {
  const response = await fetch("/api/trainer/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    let message = "Nie udało się utworzyć podopiecznego";
    try {
      const error = await response.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // ignore json parse errors
    }
    throw new Error(message);
  }

  return response.json();
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      // Invalidate all client lists to refetch
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
      toast.success("Podopieczny został utworzony. Link aktywacyjny został wysłany na podany adres email.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się utworzyć podopiecznego");
    },
  });
}
