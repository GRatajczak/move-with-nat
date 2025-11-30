import type { Database } from "../types/db";
import type { PaginationMetaDto } from "./common";

/** EXERCISES **/
/** List exercises query **/
export interface ListExercisesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

/** Summary DTO for exercise list **/
export interface ExerciseSummaryDto {
  id: Database["public"]["Tables"]["exercises"]["Row"]["id"];
  name: Database["public"]["Tables"]["exercises"]["Row"]["name"];
  defaultWeight: Database["public"]["Tables"]["exercises"]["Row"]["default_weight"];
}

/** Create exercise **/
export interface CreateExerciseCommand {
  name: Database["public"]["Tables"]["exercises"]["Insert"]["name"];
  description?: Database["public"]["Tables"]["exercises"]["Insert"]["description"];
  vimeoToken: Database["public"]["Tables"]["exercises"]["Insert"]["vimeo_token"];
  defaultWeight?: Database["public"]["Tables"]["exercises"]["Insert"]["default_weight"];
  tempo?: string | null;
}

/** Full DTO for single exercise **/
export interface ExerciseDto {
  id: Database["public"]["Tables"]["exercises"]["Row"]["id"];
  name: Database["public"]["Tables"]["exercises"]["Row"]["name"];
  description: Database["public"]["Tables"]["exercises"]["Row"]["description"];
  vimeoToken: Database["public"]["Tables"]["exercises"]["Row"]["vimeo_token"];
  defaultWeight: Database["public"]["Tables"]["exercises"]["Row"]["default_weight"];
  isHidden: Database["public"]["Tables"]["exercises"]["Row"]["is_hidden"];
  tempo: string | null;
  createdAt: string;
}

/** EXTENDED EXERCISE TYPES (VIEW MODEL) **/

/**
 * Extended ExerciseDto with additional UI fields
 */
export interface ExerciseViewModel extends ExerciseDto {
  usageCount?: number;
  thumbnailUrl?: string;
}

export interface ExercisesListState {
  exercises: ExerciseViewModel[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMetaDto;
  searchQuery: string;
}

/**
 * State for exercise form
 */
export interface ExerciseFormState {
  isSubmitting: boolean;
  error: string | null;
  isDirty: boolean;
}

/**
 * Exercise form data (extended with split description fields)
 */
export interface ExerciseFormData {
  name: string;
  vimeoToken: string;
  description: string;
  tips: string;
  tempo: string;
  defaultWeight: number | null;
}

/**
 * Props for ExerciseForm component
 */
export interface ExerciseFormProps {
  exercise?: ExerciseDto;
  onSubmit: (data: ExerciseFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * State for Vimeo preview
 */
export interface VimeoPreviewState {
  isLoading: boolean;
  error: string | null;
  isValid: boolean | null;
}

/**
 * Props for ExerciseActionMenu
 */
export interface ExerciseActionMenuProps {
  exerciseId: string;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}

/**
 * Props for DeleteConfirmationModal
 */
export interface DeleteConfirmationModalProps {
  exercise: ExerciseViewModel | null;
  isOpen: boolean;
  onConfirm: (exerciseId: string, hard: boolean) => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

/**
 * Props for ExerciseQuickPreviewModal
 */
export interface ExerciseQuickPreviewModalProps {
  exercise: ExerciseViewModel | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
}

export interface ExerciseCardsProps {
  exercises: ExerciseViewModel[];
  isLoading: boolean;
  onCardClick: (exercise: ExerciseViewModel) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (exercise: ExerciseViewModel) => void;
}

export interface VimeoPreviewWidgetProps {
  videoId: string;
  className?: string;
}

export interface PaginationProps {
  meta: PaginationMetaDto;
  onPageChange: (page: number) => void;
}

export interface ExercisesTableProps {
  exercises: ExerciseViewModel[];
  isLoading: boolean;
  onRowClick: (exercise: ExerciseViewModel) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (exercise: ExerciseViewModel) => void;
}

export interface ExercisesFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  isLoading?: boolean;
}
