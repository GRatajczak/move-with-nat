import { useQuery } from "@tanstack/react-query";
import type { UserDto } from "@/interface";

async function fetchUser(userId: string): Promise<UserDto> {
  const response = await fetch(`/api/users/${userId}`);

  if (!response.ok) {
    let message = "Failed to fetch user";
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

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000,
  });
}
