import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabaseClient } from "@/db/supabase.client";

interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

async function changePassword(params: ChangePasswordParams): Promise<void> {
  const {
    data: { user },
    error: getUserError,
  } = await supabaseClient.auth.getUser();

  if (getUserError || !user?.email) {
    throw new Error("Nie znaleziono użytkownika");
  }

  const { error: signInError } = await supabaseClient.auth.signInWithPassword({
    email: user.email,
    password: params.currentPassword,
  });

  if (signInError) {
    throw new Error("Obecne hasło jest nieprawidłowe");
  }

  const { error: updateError } = await supabaseClient.auth.updateUser({
    password: params.newPassword,
  });

  if (updateError) {
    throw new Error(updateError.message || "Nie udało się zmienić hasła");
  }
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
