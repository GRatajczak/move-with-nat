import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersKeys } from "./queryKeys";

async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    let message = "Nie udało się usunąć użytkownika";
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
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (_data, userId) => {
      // Invalidate all user lists and the deleted user's detail
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
      toast.success("Użytkownik został usunięty");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się usunąć użytkownika");
    },
  });
}
