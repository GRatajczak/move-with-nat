import { EditUserForm } from "./EditUserForm";
import { useUser } from "@/hooks/useUser";
import { useUpdateUser } from "@/hooks/useUpdateUser";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/QueryProvider";
import type { UpdateUserCommand } from "@/interface";

const EditUserContent = ({ userId }: { userId: string }) => {
  const { data: user, isLoading, error } = useUser(userId);
  const { mutateAsync: updateUser, isPending: isSubmitting } = useUpdateUser();

  const handleSubmit = async (data: {
    email: string;
    firstName: string;
    lastName: string;
    role: "administrator" | "trainer" | "client";
    status: "pending" | "active" | "suspended";
    trainerId?: string | null;
  }) => {
    const command: UpdateUserCommand = {
      firstName: data.firstName,
      lastName: data.lastName,
      status: data.status,
      trainerId: data.trainerId || undefined,
    };

    await updateUser({ userId, command });
  };

  const handleCancel = () => {
    window.location.href = `/admin/users/${userId}`;
  };

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        <p>Wystąpił błąd podczas ładowania użytkownika: {error instanceof Error ? error.message : "Nieznany błąd"}</p>
        <Button variant="outline" onClick={() => (window.location.href = "/admin/users")} className="mt-4">
          Powrót do listy użytkowników
        </Button>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Edytuj użytkownika</h1>
          <p className="text-muted-foreground">
            Edytuj dane użytkownika: {user.firstName} {user.lastName}
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do szczegółów
        </Button>
      </div>

      {/* Form */}
      <div className="md:px-0 px-4">
        <EditUserForm user={user} onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
};

export const EditUserPage = ({ userId }: { userId: string }) => {
  return (
    <QueryProvider>
      <EditUserContent userId={userId} />
    </QueryProvider>
  );
};
