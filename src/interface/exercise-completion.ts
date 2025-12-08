import type { ReasonDto } from "./completion";

/** DTO from API */
export interface ExerciseDto {
  id: string;
  name: string;
  vimeoToken: string;
  description?: string;
  goals?: string;
  steps?: string;
  tips?: string;
}

export interface CompletionStatusDto {
  completed: boolean;
  reasonId?: string;
  customReason?: string;
}

/** ViewModel */
export interface ExerciseMeta {
  sets: number;
  reps: number;
  weight?: number | null; // Allow null to match DTO if desired, or handle undefined in mapper
  tempo?: string;
}

export interface ExerciseDescription {
  description?: string;
  tips?: string;
}

export interface CompletionStatus {
  completed: boolean | null; // null = pending
  reason?: string; // mapped text
}

export interface StandardReason extends ReasonDto {
  text?: string;
}

export interface ReasonFormValues {
  reasonId?: string;
  customReason?: string;
}

export interface ExerciseHeaderProps {
  name: string;
  planId: string;
}

export interface VimeoPlayerProps {
  videoId: string;
}

export interface ExerciseMetadataGridProps {
  meta: ExerciseMeta;
}

export interface ExerciseDescriptionAccordionProps {
  description: ExerciseDescription;
}

export interface CompletionButtonsProps {
  currentStatus?: CompletionStatus;
  onUpdate: (data: { completed: boolean } & ReasonFormValues) => void;
  isUpdating?: boolean;
}

export interface NotCompletedReasonModalProps {
  isOpen: boolean;
  reasons: StandardReason[];
  onConfirm: (values: ReasonFormValues) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export interface CompletionSectionProps {
  currentStatus?: CompletionStatusDto; // Use DTO for initial state or ViewModel? Plan says CompletionStatus
  planId: string;
  exerciseId: string;
  initialStatus?: CompletionStatusDto;
}

export interface ExerciseCompletionPageProps {
  planId: string;
  exerciseId: string;
}
