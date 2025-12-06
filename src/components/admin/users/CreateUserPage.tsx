import React from "react";
import { CreateUserForm } from "./CreateUserForm";
import { useCreateUser } from "@/hooks/useCreateUser";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/QueryProvider";
import type { CreateUserCommand } from "@/interface";

const CreateUserContent: React.FC = () => {
  const { mutateAsync: createUser, isPending: isSubmitting } = useCreateUser();

  const handleSubmit = async (data: {
    email: string;
    firstName: string;
    lastName: string;
    role: "administrator" | "trainer" | "client";
    trainerId?: string;
  }) => {
    // Map form role to API role
    const mapRoleToAPI = (role: "administrator" | "trainer" | "client"): "trainer" | "client" => {
      if (role === "administrator") {
        // For now, we can't create admin users via this form
        // This should be handled differently in production
        return "trainer";
      }
      return role;
    };

    const command: CreateUserCommand = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: mapRoleToAPI(data.role),
      trainerId: data.trainerId,
    };

    await createUser(command);

    // Navigate back to users list after successful creation
    window.location.href = "/admin/users";
  };

  const handleCancel = () => {
    window.location.href = "/admin/users";
  };

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dodaj użytkownika</h1>
          <p className="text-muted-foreground">
            Utwórz nowe konto użytkownika. Link aktywacyjny zostanie wysłany na podany adres email.
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do listy
        </Button>
      </div>

      {/* Form */}
      <div className="md:px-0 px-4">
        <CreateUserForm onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
};

export const CreateUserPage: React.FC = () => {
  return (
    <QueryProvider>
      <CreateUserContent />
    </QueryProvider>
  );
};
