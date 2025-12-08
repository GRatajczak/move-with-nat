import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserDto, UpdateClientCommand } from "@/interface";
import { clientsKeys } from "../queryKeys";

async function updateClient(clientId: string, command: UpdateClientCommand): Promise<UserDto> {
  const response = await fetch(`/api/trainer/clients/${clientId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    let message = "Nie udało się zaktualizować podopiecznego";
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

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, command }: { clientId: string; command: UpdateClientCommand }) =>
      updateClient(clientId, command),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
      toast.success("Profil podopiecznego zaktualizowany pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się zaktualizować profilu podopiecznego");
    },
  });
}
