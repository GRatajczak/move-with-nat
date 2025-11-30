import { useQuery } from "@tanstack/react-query";
import type { UserDto } from "@/interface";

async function fetchTrainer(trainerId: string): Promise<UserDto> {
  const response = await fetch(`/api/users/${trainerId}`);

  if (!response.ok) {
    let message = "Failed to fetch trainer";
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

export function useTrainer(trainerId: string | null) {
  return useQuery({
    queryKey: ["users", trainerId],
    queryFn: () => fetchTrainer(trainerId ?? ""),
    enabled: !!trainerId,
    staleTime: 10 * 60 * 1000,
  });
}
