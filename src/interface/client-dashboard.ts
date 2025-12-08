/** CLIENT DASHBOARD TYPES **/

/** DTO from API - single plan for client dashboard */
export interface ClientPlanDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string; // ISO
  trainer: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  completedExercises: number; // aggregate
  totalExercises: number;
}

/** Pagination meta */
export interface ClientPlansPaginationMeta {
  page: number;
  limit: number;
  total: number;
}

/** API response for client plans list */
export interface ClientPlansResponse {
  data: ClientPlanDto[];
  meta: ClientPlansPaginationMeta;
}

/** ViewModel for plan card in client dashboard */
export interface ClientPlanCardVM {
  id: string;
  name: string;
  descriptionExcerpt: string;
  progressValue: number; // completed exercises
  progressMax: number; // total exercises
  createdAt: Date;
  trainerName: string;
  trainerAvatar?: string;
}

/** Sort options for client plans */
export type ClientPlansSortOption = "createdAt_desc" | "createdAt_asc" | "progress_desc" | "progress_asc";

/** Query params for client plans list */
export interface ClientPlansQuery {
  sort?: ClientPlansSortOption;
  page?: number;
  limit?: number;
}

/** Component Props */
export interface ClientPlanCardProps {
  plan: ClientPlanCardVM;
}

export interface ClientPlanCardsGridProps {
  plans: ClientPlanCardVM[];
}

export interface ClientPlansSortDropdownProps {
  value: ClientPlansSortOption;
  onChange: (value: ClientPlansSortOption) => void;
}
