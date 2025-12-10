// src/components/plans/edit/PlanForm.utils.ts

import type { PlanExerciseFormData } from "@/interface/plans";
import type { ExerciseDto } from "@/interface/exercises";

/**
 * Updates sortOrder for all exercises in the array sequentially
 * Used after adding, removing, or reordering exercises
 */
export function updateSortOrder(exercises: PlanExerciseFormData[]): PlanExerciseFormData[] {
  return exercises.map((exercise, index) => ({
    ...exercise,
    sortOrder: index + 1,
  }));
}

/**
 * Removes an exercise at the specified index and updates sortOrder for remaining exercises
 */
export function removeExercise(exercises: PlanExerciseFormData[], index: number): PlanExerciseFormData[] {
  const filtered = exercises.filter((_, i) => i !== index);
  return updateSortOrder(filtered);
}

/**
 * Adds new exercises to the existing list with proper sortOrder
 */
export function addExercises(
  existingExercises: PlanExerciseFormData[],
  newExercises: ExerciseDto[],
  defaultSets = 3,
  defaultReps = 10,
  defaultTempo = "3-0-3"
): PlanExerciseFormData[] {
  const startingSortOrder = existingExercises.length;

  const newFormExercises: PlanExerciseFormData[] = newExercises.map((ex, index) => ({
    exerciseId: ex.id,
    sortOrder: startingSortOrder + index + 1,
    sets: defaultSets,
    reps: defaultReps,
    tempo: defaultTempo,
    defaultWeight: ex.defaultWeight || null,
    exercise: ex,
  }));

  return [...existingExercises, ...newFormExercises];
}

/**
 * Updates a specific exercise in the list
 */
export function updateExercise(
  exercises: PlanExerciseFormData[],
  index: number,
  updates: Partial<PlanExerciseFormData>
): PlanExerciseFormData[] {
  return exercises.map((exercise, i) => (i === index ? { ...exercise, ...updates } : exercise));
}

/**
 * Reorders exercises and updates their sortOrder
 */
export function reorderExercises(exercises: PlanExerciseFormData[]): PlanExerciseFormData[] {
  return updateSortOrder(exercises);
}

/**
 * Validates if an exercise ID already exists in the list (to prevent duplicates)
 */
export function isDuplicateExercise(exercises: PlanExerciseFormData[], exerciseId: string): boolean {
  return exercises.some((ex) => ex.exerciseId === exerciseId);
}

/**
 * Filters out duplicate exercises when adding new ones
 */
export function filterDuplicateExercises(
  existingExercises: PlanExerciseFormData[],
  newExercises: ExerciseDto[]
): ExerciseDto[] {
  const existingIds = new Set(existingExercises.map((ex) => ex.exerciseId));
  return newExercises.filter((ex) => !existingIds.has(ex.id));
}

/**
 * Validates exercise data before submission
 */
export function validateExerciseData(exercise: PlanExerciseFormData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!exercise.exerciseId) {
    errors.push("Exercise ID is required");
  }

  if (exercise.sets < 1 || exercise.sets > 100) {
    errors.push("Sets must be between 1 and 100");
  }

  if (exercise.reps < 1 || exercise.reps > 1000) {
    errors.push("Reps must be between 1 and 1000");
  }

  if (exercise.sortOrder < 1) {
    errors.push("Sort order must be at least 1");
  }

  if (exercise.defaultWeight !== null && exercise.defaultWeight < 0) {
    errors.push("Default weight cannot be negative");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets exercises that need to be removed when updating a plan
 * Compares original exercises with updated ones
 */
export function getExercisesToRemove(
  originalExercises: PlanExerciseFormData[],
  updatedExercises: PlanExerciseFormData[]
): string[] {
  const updatedIds = new Set(updatedExercises.map((ex) => ex.exerciseId));
  return originalExercises.filter((ex) => !updatedIds.has(ex.exerciseId)).map((ex) => ex.exerciseId);
}

/**
 * Gets exercises that need to be added when updating a plan
 */
export function getExercisesToAdd(
  originalExercises: PlanExerciseFormData[],
  updatedExercises: PlanExerciseFormData[]
): PlanExerciseFormData[] {
  const originalIds = new Set(originalExercises.map((ex) => ex.exerciseId));
  return updatedExercises.filter((ex) => !originalIds.has(ex.exerciseId));
}
