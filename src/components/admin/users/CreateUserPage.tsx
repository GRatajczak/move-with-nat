import React, { useState } from "react";
import { CreateUserForm } from "./CreateUserForm";
import { useCreateUser } from "@/hooks/useCreateUser";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/QueryProvider";
import type { CreateUserCommand } from "@/interface";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CreateUserContent: React.FC = () => {
  const { mutateAsync: createUser, isPending: isSubmitting } = useCreateUser();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    role: "administrator" | "trainer" | "client";
    trainerId?: string;
  }) => {
    // Map form role to API role (form uses "administrator", API uses "admin")
    const mapRoleToAPI = (role: "administrator" | "trainer" | "client"): "admin" | "trainer" | "client" => {
      if (role === "administrator") {
        return "admin";
      }
      return role;
    };

    const command: CreateUserCommand = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      role: mapRoleToAPI(data.role),
      trainerId: data.trainerId,
    };

    await createUser(command);

    setShowSuccessModal(true);
  };

  const handleCancel = () => {
    window.location.href = "/admin/users";
  };

  const handleGoBack = () => {
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

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-12 min-w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="mb-2">Użytkownik utworzony</DialogTitle>
                <DialogDescription>
                  Nowe konto użytkownika zostało pomyślnie utworzone. Link aktywacyjny został wysłany na podany adres
                  email.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button onClick={handleGoBack} className="ml-auto w-full sm:w-auto">
              Wróć do listy użytkowników
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
