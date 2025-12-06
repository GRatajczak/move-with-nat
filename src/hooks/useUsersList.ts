import { useQuery } from "@tanstack/react-query";
import type { ListUsersQuery, PaginatedResponse, UserDto } from "@/interface";
import { usersKeys } from "./queryKeys";

async function fetchUsersList(query: ListUsersQuery): Promise<PaginatedResponse<UserDto>> {
  const params = new URLSearchParams();

  if (query.search) params.append("search", query.search);
  if (query.role) params.append("role", query.role);
  if (query.status) params.append("status", query.status);
  if (query.trainerId) params.append("trainerId", query.trainerId);
  if (query.page) params.append("page", query.page.toString());
  if (query.limit) params.append("limit", query.limit.toString());

  const response = await fetch(`/api/users?${params.toString()}`);

  if (!response.ok) {
    let message = "Failed to fetch users list";
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

export function useUsersList(query: ListUsersQuery) {
  return useQuery({
    queryKey: usersKeys.list(query),
    queryFn: () => fetchUsersList(query),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
  });
}
