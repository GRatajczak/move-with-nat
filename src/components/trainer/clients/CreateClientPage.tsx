import React, { useState } from "react";
import { CreateClientForm } from "./CreateClientForm";
import { useCreateClient } from "@/hooks/clients/useCreateClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { QueryProvider } from "@/components/QueryProvider";
import type { CreateClientFormData } from "@/interface";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CreateClientContent = () => {
  const { mutateAsync: createClient, isPending: isSubmitting } = useCreateClient();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (data: CreateClientFormData) => {
    await createClient(data);
    setShowSuccessModal(true);
  };

  const handleCancel = () => {
    window.location.href = "/trainer/clients";
  };

  const handleGoBack = () => {
    window.location.href = "/trainer/clients";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dodaj podopiecznego</h1>
          <p className="text-muted-foreground">
            Utwórz nowe konto dla podopiecznego. Link aktywacyjny zostanie wysłany na podany adres email.
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do listy
        </Button>
      </div>

      {/* Form */}
      <div className="md:px-0 px-4">
        <CreateClientForm onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isSubmitting} />
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-12 min-w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="mb-2">Podopieczny utworzony</DialogTitle>
                <DialogDescription>
                  Nowe konto podopiecznego zostało pomyślnie utworzone. Link aktywacyjny został wysłany na podany adres
                  email.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button onClick={handleGoBack} className="ml-auto w-full sm:w-auto">
              Wróć do listy podopiecznych
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const CreateClientPage: React.FC = () => {
  return (
    <QueryProvider>
      <CreateClientContent />
    </QueryProvider>
  );
};
