import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTrainerClients } from "@/hooks/useTrainerClients";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { ClientSelectProps } from "@/interface/plans";

/**
 * Searchable select component for choosing a client
 * Automatically fetches and displays clients assigned to the current trainer
 * Supports clientId URL search param to pre-select a client
 */
export const ClientSelect = ({ value, onChange, disabled = false, className, allowAll = false }: ClientSelectProps) => {
  const { data: clients, isLoading, error } = useTrainerClients();

  // Handle clientId from URL search params
  useEffect(() => {
    if (!clients || clients.length === 0 || isLoading) return;

    const searchParams = new URLSearchParams(window.location.search);
    const clientIdFromUrl = searchParams.get("clientId");

    // If clientId is in URL and different from current value
    if (clientIdFromUrl && clientIdFromUrl !== value) {
      // Check if client exists in the list
      const clientExists = clients.some((client) => client.id === clientIdFromUrl);

      if (clientExists) {
        // Set the client from URL as selected
        onChange(clientIdFromUrl);
      }
    }
  }, [clients, isLoading, value, onChange]);

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
      <Alert className="w-full">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Nie masz jeszcze przypisanych podopiecznych.</AlertDescription>
      </Alert>
    );
  }

  // Filter only active clients (status === 'active')
  const activeClients = clients.filter((client) => client.status === "active");

  if (activeClients.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Brak aktywnych podopiecznych.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Select value={value || "all"} onValueChange={(val) => onChange(val === "all" ? null : val)} disabled={disabled}>
      <SelectTrigger className={className} data-testid="client-select">
        <SelectValue placeholder="Wybierz podopiecznego" />
      </SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value="all">Wszyscy podopieczni</SelectItem>}
        {activeClients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            {client.firstName} {client.lastName}
            {client.status !== "active" && ` (${client.status === "pending" ? "oczekujący" : "zawieszony"})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
