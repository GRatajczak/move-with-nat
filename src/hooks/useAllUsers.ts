import { useQuery } from "@tanstack/react-query";
import type { UserDto } from "@/interface";

/**
 * Fetch all clients (for admin use)
 * Admin can see all clients regardless of trainer assignment
 * Note: Limited to 100 results due to API constraints
 */
async function fetchAllClients(): Promise<UserDto[]> {
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
 * Fetch all trainers (for admin use)
 * Admin can see all trainers in the system
 */
async function fetchAllTrainers(): Promise<UserDto[]> {
  const response = await fetch("/api/users?role=trainer&limit=100");

  if (!response.ok) {
    let message = "Failed to fetch trainers";
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
 * Hook to fetch all clients (Admin only)
 * Returns all clients in the system
 */
export function useAllClients() {
  return useQuery({
    queryKey: ["users", { role: "client", scope: "all" }],
    queryFn: fetchAllClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch all trainers (Admin only)
 * Returns all trainers in the system
 */
export function useAllTrainers() {
  return useQuery({
    queryKey: ["users", { role: "trainer", scope: "all" }],
    queryFn: fetchAllTrainers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
