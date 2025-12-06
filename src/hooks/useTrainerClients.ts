import { useQuery } from "@tanstack/react-query";
import type { UserDto } from "@/interface";

/**
 * Fetch clients for the current trainer
 * Uses the existing /api/users endpoint with role=client filter
 * Trainers automatically see only their own clients (enforced by backend)
 */
async function fetchTrainerClients(): Promise<UserDto[]> {
  const response = await fetch("/api/users?role=client&limit=100");

  if (!response.ok) {
    let message = "Failed to fetch clients";
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

  const result = await response.json();
  return result.data || [];
}

/**
 * Hook to fetch trainer's clients
 * Returns all active clients assigned to the current trainer
 */
export function useTrainerClients() {
  return useQuery({
    queryKey: ["users", { role: "client" }],
    queryFn: fetchTrainerClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
