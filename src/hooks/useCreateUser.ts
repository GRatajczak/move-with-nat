import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserDto, CreateUserCommand } from "@/interface";
import { usersKeys } from "./queryKeys";

async function createUser(command: CreateUserCommand): Promise<UserDto> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    let message = "Nie udało się utworzyć użytkownika";
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

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // Invalidate all user lists to refetch
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      toast.success("Użytkownik został utworzony. Link aktywacyjny został wysłany na podany adres email.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się utworzyć użytkownika");
    },
  });
}
