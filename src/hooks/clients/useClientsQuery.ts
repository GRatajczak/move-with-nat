import { useQuery } from "@tanstack/react-query";
import type { ClientsPageQuery, ClientsPaginatedResponse } from "../../interface/clients";
import { clientsKeys } from "../queryKeys";

/**
 * Fetch list of trainer's clients with filters & pagination
 */
async function fetchTrainerClients(query: ClientsPageQuery): Promise<ClientsPaginatedResponse> {
  const params = new URLSearchParams();

  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const response = await fetch(`/api/trainer/clients?${params}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch clients list");
  }

  return response.json();
}

export function useClientsQuery(query: ClientsPageQuery) {
  return useQuery({
    queryKey: clientsKeys.list(query),
    queryFn: () => fetchTrainerClients(query),
    staleTime: 30_000, // 30s
  });
}
