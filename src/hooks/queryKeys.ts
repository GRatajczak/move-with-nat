import type { ListExercisesQuery, ListPlansQuery, ListUsersQuery } from "../interface";
import type { ClientsFilters, ClientsPageQuery } from "../interface/clients";

export const exerciseKeys = {
  all: ["exercises"] as const,
  lists: () => [...exerciseKeys.all, "list"] as const,
  list: (query: ListExercisesQuery) => [...exerciseKeys.lists(), query] as const,
  details: () => [...exerciseKeys.all, "detail"] as const,
  detail: (id: string) => [...exerciseKeys.details(), id] as const,
};

export const plansKeys = {
  all: ["plans"] as const,
  lists: () => [...plansKeys.all, "list"] as const,
  list: (filters: ListPlansQuery) => [...plansKeys.lists(), filters] as const,
  details: () => [...plansKeys.all, "detail"] as const,
  detail: (id: string) => [...plansKeys.details(), id] as const,
  completion: (planId: string) => [...plansKeys.all, "completion", planId] as const,
};

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (query: ListUsersQuery) => [...usersKeys.lists(), query] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};

export const clientsKeys = {
  all: ["clients"] as const,
  lists: () => [...clientsKeys.all, "list"] as const,
  list: (query: ClientsPageQuery) => [...clientsKeys.lists(), query] as const,
};

export const QUERY_KEYS = {
  exercises: exerciseKeys,
  plans: plansKeys,
  users: usersKeys,
  clients: clientsKeys,
  reasons: {
    all: ["reasons"] as const,
    detail: (id: string) => ["reasons", id] as const,
  },
};
