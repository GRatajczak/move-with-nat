import { useQuery } from "@tanstack/react-query";
import type { ClientDto } from "@/interface";

async function fetchClient(clientId: string): Promise<ClientDto> {
  const response = await fetch(`/api/trainer/clients/${clientId}`);

  if (!response.ok) {
    let message = "Nie udało się pobrać danych podopiecznego";
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

export function useClient(clientId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["clients", clientId],
    queryFn: () => fetchClient(clientId),
    enabled: options?.enabled !== false && !!clientId,
  });
}
