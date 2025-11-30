import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserDto, UpdateUserCommand } from "@/interface";

async function updateUser(userId: string, command: UpdateUserCommand): Promise<UserDto> {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    let message = "Failed to update user";
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

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, command }: { userId: string; command: UpdateUserCommand }) => updateUser(userId, command),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
      toast.success("Profil zaktualizowany pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się zaktualizować profilu");
    },
  });
}
