import type { Database } from "../types/db";
import type { IsHidden } from "../types/plans";
import type { ExerciseDto } from "./exercises";
import type { AdminPlanFormSchema, PlanFormSchema } from "@/types/plans";

/** PLANS **/
/** List plans query **/
export interface ListPlansQuery {
  search?: string;
  trainerId?: string;
  clientId?: string;
  visible?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "created_at";
  includeExerciseDetails?: boolean;
}

/** Summary DTO for plan list **/
export interface PlanSummaryDto {
  id: Database["public"]["Tables"]["plans"]["Row"]["id"];
  name: Database["public"]["Tables"]["plans"]["Row"]["name"];
  isHidden: IsHidden;
}

/** Nested exercise in plan **/
export interface PlanExerciseDto {
  id: Database["public"]["Tables"]["plan_exercises"]["Row"]["id"];
  exerciseId: string;
  sortOrder: number;
  sets: number;
  reps: number;
  tempo: Database["public"]["Tables"]["plan_exercises"]["Row"]["tempo"];
  defaultWeight?: Database["public"]["Tables"]["plan_exercises"]["Row"]["default_weight"];
  exercise?: ExerciseDto; // Optional: full exercise details when includeExerciseDetails is true
}

export interface Exercise {
  exerciseId: string;
  sortOrder: number;
  sets: number;
  reps: number;
  tempo: string;
  defaultWeight?: number | null;
}

/** Create plan **/
export interface CreatePlanCommand {
  name: Database["public"]["Tables"]["plans"]["Insert"]["name"];
  clientId?: Database["public"]["Tables"]["plans"]["Insert"]["client_id"];
  trainerId?: Database["public"]["Tables"]["plans"]["Insert"]["trainer_id"];
  isHidden?: IsHidden;
  description?: string | null;
  exercises: Exercise[];
}

/** Full DTO for single plan **/
export interface PlanDto {
  id: Database["public"]["Tables"]["plans"]["Row"]["id"];
  name: Database["public"]["Tables"]["plans"]["Row"]["name"];
  description: Database["public"]["Tables"]["plans"]["Row"]["description"];
  clientId: Database["public"]["Tables"]["plans"]["Row"]["client_id"];
  clientName?: string | null; // Full name of the client (first_name + last_name)
  trainerId: Database["public"]["Tables"]["plans"]["Row"]["trainer_id"];
  isHidden: IsHidden;
  createdAt: Database["public"]["Tables"]["plans"]["Row"]["created_at"];
  updatedAt: Database["public"]["Tables"]["plans"]["Row"]["updated_at"];
  exercises: PlanExerciseDto[];
}

/** Toggle visibility **/
export interface TogglePlanVisibilityCommand {
  id: string;
  isHidden: IsHidden;
}

/** PLAN EXERCISES (nested) **/
export interface AddExerciseToPlanCommand {
  exerciseId: string;
  sortOrder: number;
  sets?: number;
  reps?: number;
  tempo?: string;
  defaultWeight?: number | null;
}
export interface UpdateExerciseInPlanCommand {
  sortOrder?: number;
  sets?: number;
  reps?: number;
  tempo?: string;
  defaultWeight?: number | null;
}

/** Update plan command **/
export interface UpdatePlanCommand extends Partial<Omit<CreatePlanCommand, "exercises">> {
  id: string;
  exercises?: PlanExerciseDto[];
}

/** Frontend ViewModel Types **/
export interface PlanViewModel extends PlanDto {
  clientName?: string;
  clientAvatar?: string;
  trainerName?: string;
  completionStats?: {
    completed: number;
    total: number;
  };
}

export interface PlansListState {
  plans: PlanViewModel[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
    clientId: string | null;
    visible: boolean | null;
    sortBy: string;
  };
}

export interface PlanFormData {
  name: string;
  description: string;
  clientId?: string; // Optional - nullable in DB
  isHidden: boolean;
  exercises: PlanExerciseFormData[];
}

export interface PlanExerciseFormData {
  exerciseId: string;
  sortOrder: number;
  sets: number;
  reps: number;
  tempo: string;
  defaultWeight: number | null;
  exercise?: ExerciseDto;
}

export interface PlanFormState {
  isSubmitting: boolean;
  error: string | null;
  isDirty: boolean;
}

export interface PlanDetailState {
  plan: PlanViewModel | null;
  isLoading: boolean;
  error: string | null;
  completionRecords: ExerciseCompletionRecord[];
}

export interface ExerciseCompletionRecord {
  planId: string;
  exerciseId: string;
  isCompleted: boolean;
  reasonId: string | null;
  customReason: string | null;
  completedAt: string | null;
}

export interface DuplicatePlanData {
  name: string;
  clientId?: string; // Optional - nullable in DB
  isHidden: boolean;
}

/** Component Props Interfaces **/
export interface PlansFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  clientId: string | null;
  onClientChange: (clientId: string | null) => void;
  visible: boolean | null;
  onVisibilityChange: (visible: boolean | null) => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  isLoading?: boolean;
}

export interface PlansTableProps {
  plans: PlanViewModel[];
  isLoading: boolean;
  onRowClick: (planId: string) => void;
  onEdit: (planId: string) => void;
  onToggleVisibility: (planId: string, isHidden: boolean) => void;
  onDuplicate: (planId: string) => void;
  onDelete: (planId: string) => void;
}

export interface CreatePlanContainerProps {
  trainerId: string;
  userRole?: "admin" | "trainer";
  defaultClientId?: string;
}

export interface EditPlanContainerProps {
  planId: string;
  userRole?: "admin" | "trainer";
}

export interface PlanDetailContainerProps {
  planId: string;
  userRole?: "admin" | "trainer";
}

export interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (exercises: ExerciseDto[]) => void;
  excludeExerciseIds?: string[];
}

export interface DuplicatePlanModalProps {
  isOpen: boolean;
  plan: PlanViewModel | null;
  onClose: () => void;
  onConfirm: (data: DuplicatePlanData) => Promise<void>;
  isSubmitting: boolean;
  userRole?: "admin" | "trainer";
}

export interface DeletePlanConfirmationModalProps {
  isOpen: boolean;
  plan: PlanViewModel | null;
  onClose: () => void;
  onConfirm: (planId: string, hard: boolean) => Promise<void>;
  isDeleting: boolean;
}

export interface PlanExercisePreviewModalProps {
  isOpen: boolean;
  exercise: ExerciseDto | null;
  onClose: () => void;
  onEdit?: (exerciseId: string) => void;
}

export interface PlanExerciseRowProps {
  exercise: PlanExerciseFormData;
  index: number;
  onRemove: () => void;
  onUpdate: (updates: Partial<PlanExerciseFormData>) => void;
  disabled?: boolean;
}

export interface PlanActionMenuProps {
  plan: PlanViewModel;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export interface PlanExercisesDetailListProps {
  exercises: PlanExerciseDto[];
  completionRecords: ExerciseCompletionRecord[];
}

export interface ClientSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
  allowAll?: boolean;
}

export interface AdminClientSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export interface AdminPlanFormProps {
  plan?: PlanViewModel | null;
  onSubmit: (data: AdminPlanFormSchema) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: "create" | "edit";
}

export interface AdminPlanFormProps {
  plan?: PlanViewModel | null;
  onSubmit: (data: AdminPlanFormSchema) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: "create" | "edit";
}

export interface ExerciseCompletionRowProps {
  exercise: PlanExerciseDto;
  orderNumber: number;
  completion?: ExerciseCompletionRecord;
  onPreviewClick: () => void;
}

export interface PlanDetailHeaderProps {
  plan: PlanViewModel;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export interface PlanExercisesListProps {
  exercises: PlanExerciseFormData[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<PlanExerciseFormData>) => void;
  onReorder: (reordered: PlanExerciseFormData[]) => void;
  disabled?: boolean;
}

export interface PlanFormProps {
  plan?: PlanViewModel | null;
  onSubmit: (data: PlanFormSchema) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: "create" | "edit";
}
