// src/lib/mappers.ts

import type { Database } from "../db/database.types";
import type { ExerciseDto, ExerciseSummaryDto } from "../types";

type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];

/**
 * Maps database exercise row to ExerciseDto
 */
export function mapExerciseToDTO(exercise: ExerciseRow): ExerciseDto {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    vimeoToken: exercise.vimeo_token,
    defaultWeight: exercise.default_weight,
    isHidden: exercise.is_hidden,
  };
}

/**
 * Maps database exercise row to ExerciseSummaryDto
 */
export function mapExerciseToSummaryDTO(exercise: ExerciseRow): ExerciseSummaryDto {
  return {
    id: exercise.id,
    name: exercise.name,
    defaultWeight: exercise.default_weight,
  };
}

