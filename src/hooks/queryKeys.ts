import type { ListExercisesQuery } from "../interface";

export const exerciseKeys = {
  all: ["exercises"] as const,
  lists: () => [...exerciseKeys.all, "list"] as const,
  list: (query: ListExercisesQuery) => [...exerciseKeys.lists(), query] as const,
  details: () => [...exerciseKeys.all, "detail"] as const,
  detail: (id: string) => [...exerciseKeys.details(), id] as const,
};

export const QUERY_KEYS = {
  exercises: exerciseKeys,
  reasons: {
    all: ["reasons"] as const,
    detail: (id: string) => ["reasons", id] as const,
  },
};
