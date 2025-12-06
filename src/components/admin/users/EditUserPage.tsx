import React from "react";
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
    isActive: boolean;
    trainerId?: string;
  }) => {
    // Map form role to API role
    const mapRoleToAPI = (role: "administrator" | "trainer" | "client"): "trainer" | "client" | undefined => {
      if (role === "administrator") {
        // Skip role update for admin (or handle differently)
        return undefined;
      }
      return role;
    };

    const command: UpdateUserCommand = {
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: data.isActive,
      trainerId: data.trainerId,
    };

    // Only include role if it changed and is not admin
    const apiRole = mapRoleToAPI(data.role);
    if (apiRole) {
      // Note: Role changes might need special handling in production
      // For now, we're not changing roles via edit
    }

    await updateUser({ userId, command });

    // Navigate back to user detail after successful update
    window.location.href = `/admin/users/${userId}`;
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

interface EditUserPageProps {
  userId: string;
}

export const EditUserPage: React.FC<EditUserPageProps> = ({ userId }) => {
  return (
    <QueryProvider>
      <EditUserContent userId={userId} />
    </QueryProvider>
  );
};
