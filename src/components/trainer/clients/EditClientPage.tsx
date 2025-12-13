import { EditClientForm } from "./EditClientForm";
import { useClient } from "@/hooks/clients/useClient";
import { useUpdateClient } from "@/hooks/clients/useUpdateClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { QueryProvider } from "@/components/QueryProvider";
import type { EditClientFormData } from "@/interface";

const EditClientContent = ({ clientId }: { clientId: string }) => {
  const { data: client, isLoading, error } = useClient(clientId);
  const { mutateAsync: updateClient, isPending: isSubmitting } = useUpdateClient();

  const handleSubmit = async (data: EditClientFormData) => {
    const command = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
    };

    await updateClient({ clientId, command });
  };

  const handleCancel = () => {
    window.location.href = `/trainer/clients/${clientId}`;
  };

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">
        <p>Wystąpił błąd podczas ładowania podopiecznego: {error instanceof Error ? error.message : "Nieznany błąd"}</p>
        <Button variant="outline" onClick={() => (window.location.href = "/trainer/clients")} className="mt-4">
          Powrót do listy podopiecznych
        </Button>
      </div>
    );
  }

  if (isLoading || !client) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start md:items-center justify-between md:px-0 px-4 flex-col-reverse md:flex-row gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Edytuj podopiecznego</h1>
          <p className="text-muted-foreground">
            Edytuj dane podopiecznego: {client.firstName} {client.lastName}
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do szczegółów
        </Button>
      </div>

      {/* Form */}
      <div className="md:px-0 px-4">
        <EditClientForm client={client} onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
};

export const EditClientPage = ({ clientId }: { clientId: string }) => {
  return (
    <QueryProvider>
      <EditClientContent clientId={clientId} />
    </QueryProvider>
  );
};
