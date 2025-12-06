import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllClients } from "@/hooks/useAllUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { AdminClientSelectProps } from "@/interface/plans";

/**
 * Select component for choosing a client (Admin only)
 * Fetches and displays all clients in the system, regardless of trainer assignment
 */
export const AdminClientSelect = ({ value, onChange, disabled = false }: AdminClientSelectProps) => {
  const { data: clients, isLoading, error } = useAllClients();

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Nie udało się załadować listy podopiecznych. Spróbuj odświeżyć stronę.</AlertDescription>
      </Alert>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Brak podopiecznych w systemie.</AlertDescription>
      </Alert>
    );
  }

  // Filter only active clients (those who completed their profile)
  const activeClients = clients.filter((client) => client.firstName && client.lastName && client.isActive);

  if (activeClients.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Brak aktywnych podopiecznych. Podopieczni muszą uzupełnić profil zanim będzie można dla nich tworzyć plany.
        </AlertDescription>
      </Alert>
    );
  }

  const handleValueChange = (selectedValue: string) => {
    // Convert "none" back to empty string for the form
    onChange(selectedValue === "none" ? "" : selectedValue);
  };

  return (
    <Select className="w-full" value={value || "none"} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Wybierz podopiecznego (opcjonalnie)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Brak (wybierz później)</SelectItem>
        {activeClients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            <div className="flex flex-col">
              <span>
                {client.firstName} {client.lastName}
              </span>
              <span className="text-xs text-muted-foreground">{client.email}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
