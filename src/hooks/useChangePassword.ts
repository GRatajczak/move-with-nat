import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

async function changePassword(params: ChangePasswordParams): Promise<void> {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let message = "Nie udało się zmienić hasła";
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

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Hasło zostało zmienione pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się zmienić hasła");
    },
  });
}
