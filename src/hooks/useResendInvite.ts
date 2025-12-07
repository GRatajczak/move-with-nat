import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { InviteUserCommand } from "@/interface";

async function resendInvite(command: InviteUserCommand): Promise<{ message: string }> {
  const response = await fetch("/api/auth/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...command, resend: true }),
  });

  if (!response.ok) {
    let message = "Nie udało się wysłać ponownie zaproszenia";
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

export function useResendInvite() {
  return useMutation({
    mutationFn: resendInvite,
    onSuccess: () => {
      toast.success("Link aktywacyjny został ponownie wysłany na adres email użytkownika.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się wysłać ponownie zaproszenia");
    },
  });
}
