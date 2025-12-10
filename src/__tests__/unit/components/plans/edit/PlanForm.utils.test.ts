// src/components/plans/edit/PlanForm.utils.test.ts

import { describe, it, expect } from "vitest";
import {
  updateSortOrder,
  removeExercise,
  addExercises,
  updateExercise,
  reorderExercises,
  isDuplicateExercise,
  filterDuplicateExercises,
  validateExerciseData,
  getExercisesToRemove,
  getExercisesToAdd,
} from "../../../../../components/plans/edit/PlanForm.utils";
import type { PlanExerciseFormData } from "@/interface/plans";
import type { ExerciseDto } from "@/interface/exercises";

describe("PlanForm.utils", () => {
  describe("updateSortOrder", () => {
    it("should update sortOrder sequentially starting from 1", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 5, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 10, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-3", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = updateSortOrder(exercises);

      // Assert
      expect(result[0].sortOrder).toBe(1);
      expect(result[1].sortOrder).toBe(2);
      expect(result[2].sortOrder).toBe(3);
    });

    it("should handle empty array", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [];

      // Act
      const result = updateSortOrder(exercises);

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle single exercise", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 99, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = updateSortOrder(exercises);

      // Assert
      expect(result[0].sortOrder).toBe(1);
    });

    it("should preserve other exercise properties", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 5, sets: 4, reps: 12, tempo: "3-1-2", defaultWeight: 50 },
      ];

      // Act
      const result = updateSortOrder(exercises);

      // Assert
      expect(result[0]).toEqual({
        exerciseId: "ex-1",
        sortOrder: 1,
        sets: 4,
        reps: 12,
        tempo: "3-1-2",
        defaultWeight: 50,
      });
    });
  });

  describe("removeExercise", () => {
    it("should remove exercise at specified index", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-3", sortOrder: 3, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act - Remove middle exercise
      const result = removeExercise(exercises, 1);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].exerciseId).toBe("ex-1");
      expect(result[1].exerciseId).toBe("ex-3");
    });

    it("should update sortOrder after removal", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-3", sortOrder: 3, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act - Remove first exercise
      const result = removeExercise(exercises, 0);

      // Assert
      expect(result[0].exerciseId).toBe("ex-2");
      expect(result[0].sortOrder).toBe(1); // Updated from 2 to 1
      expect(result[1].exerciseId).toBe("ex-3");
      expect(result[1].sortOrder).toBe(2); // Updated from 3 to 2
    });

    it("should remove first exercise", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = removeExercise(exercises, 0);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].exerciseId).toBe("ex-2");
      expect(result[0].sortOrder).toBe(1);
    });

    it("should remove last exercise", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = removeExercise(exercises, 1);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].exerciseId).toBe("ex-1");
      expect(result[0].sortOrder).toBe(1);
    });

    it("should handle removing only exercise", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = removeExercise(exercises, 0);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe("addExercises", () => {
    it("should add new exercises with correct sortOrder", () => {
      // Arrange
      const existing: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      const newExercises: ExerciseDto[] = [
        {
          id: "ex-3",
          name: "New Exercise 1",
          vimeoToken: "123",
          description: "",
          defaultWeight: 50,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "ex-4",
          name: "New Exercise 2",
          vimeoToken: "456",
          description: "",
          defaultWeight: null,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      // Act
      const result = addExercises(existing, newExercises);

      // Assert
      expect(result).toHaveLength(4);
      expect(result[2].exerciseId).toBe("ex-3");
      expect(result[2].sortOrder).toBe(3);
      expect(result[3].exerciseId).toBe("ex-4");
      expect(result[3].sortOrder).toBe(4);
    });

    it("should use default values for sets, reps, and tempo", () => {
      // Arrange
      const existing: PlanExerciseFormData[] = [];
      const newExercises: ExerciseDto[] = [
        {
          id: "ex-1",
          name: "Exercise",
          vimeoToken: "123",
          description: "",
          defaultWeight: null,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      // Act
      const result = addExercises(existing, newExercises);

      // Assert
      expect(result[0].sets).toBe(3);
      expect(result[0].reps).toBe(10);
      expect(result[0].tempo).toBe("3-0-3");
    });

    it("should use custom default values", () => {
      // Arrange
      const existing: PlanExerciseFormData[] = [];
      const newExercises: ExerciseDto[] = [
        {
          id: "ex-1",
          name: "Exercise",
          vimeoToken: "123",
          description: "",
          defaultWeight: null,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      // Act
      const result = addExercises(existing, newExercises, 5, 15, "2-0-2");

      // Assert
      expect(result[0].sets).toBe(5);
      expect(result[0].reps).toBe(15);
      expect(result[0].tempo).toBe("2-0-2");
    });

    it("should preserve defaultWeight from exercise", () => {
      // Arrange
      const existing: PlanExerciseFormData[] = [];
      const newExercises: ExerciseDto[] = [
        {
          id: "ex-1",
          name: "Exercise",
          vimeoToken: "123",
          description: "",
          defaultWeight: 75,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      // Act
      const result = addExercises(existing, newExercises);

      // Assert
      expect(result[0].defaultWeight).toBe(75);
    });

    it("should add to empty list", () => {
      // Arrange
      const existing: PlanExerciseFormData[] = [];
      const newExercises: ExerciseDto[] = [
        {
          id: "ex-1",
          name: "First Exercise",
          vimeoToken: "123",
          description: "",
          defaultWeight: null,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      // Act
      const result = addExercises(existing, newExercises);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].sortOrder).toBe(1);
    });

    it("should include exercise reference in form data", () => {
      // Arrange
      const existing: PlanExerciseFormData[] = [];
      const exerciseDto: ExerciseDto = {
        id: "ex-1",
        name: "Exercise",
        vimeoToken: "123",
        description: "Test description",
        defaultWeight: null,
        isHidden: false,
        tempo: null,
        createdAt: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = addExercises(existing, [exerciseDto]);

      // Assert
      expect(result[0].exercise).toEqual(exerciseDto);
    });
  });

  describe("updateExercise", () => {
    it("should update specific exercise properties", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = updateExercise(exercises, 0, { sets: 5, reps: 15 });

      // Assert
      expect(result[0].sets).toBe(5);
      expect(result[0].reps).toBe(15);
      expect(result[0].tempo).toBe("3-0-3"); // Unchanged
      expect(result[1].sets).toBe(3); // Other exercise unchanged
    });

    it("should update only specified properties", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: 50 },
      ];

      // Act
      const result = updateExercise(exercises, 0, { defaultWeight: 60 });

      // Assert
      expect(result[0].defaultWeight).toBe(60);
      expect(result[0].sets).toBe(3); // Unchanged
      expect(result[0].reps).toBe(10); // Unchanged
    });

    it("should not modify other exercises", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 4, reps: 12, tempo: "2-0-2", defaultWeight: 50 },
        { exerciseId: "ex-3", sortOrder: 3, sets: 5, reps: 8, tempo: "3-1-2", defaultWeight: 60 },
      ];

      // Act
      const result = updateExercise(exercises, 1, { sets: 6 });

      // Assert
      expect(result[0]).toEqual(exercises[0]); // Unchanged
      expect(result[1].sets).toBe(6); // Updated
      expect(result[2]).toEqual(exercises[2]); // Unchanged
    });
  });

  describe("reorderExercises", () => {
    it("should update sortOrder for reordered exercises", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-3", sortOrder: 3, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = reorderExercises(exercises);

      // Assert
      expect(result[0].exerciseId).toBe("ex-3");
      expect(result[0].sortOrder).toBe(1); // Updated
      expect(result[1].exerciseId).toBe("ex-1");
      expect(result[1].sortOrder).toBe(2); // Updated
      expect(result[2].exerciseId).toBe("ex-2");
      expect(result[2].sortOrder).toBe(3); // Updated
    });
  });

  describe("isDuplicateExercise", () => {
    it("should return true for duplicate exercise", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = isDuplicateExercise(exercises, "ex-1");

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for non-duplicate exercise", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = isDuplicateExercise(exercises, "ex-3");

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for empty list", () => {
      // Arrange
      const exercises: PlanExerciseFormData[] = [];

      // Act
      const result = isDuplicateExercise(exercises, "ex-1");

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("filterDuplicateExercises", () => {
    it("should filter out duplicate exercises", () => {
      // Arrange
      const existing: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      const newExercises: ExerciseDto[] = [
        {
          id: "ex-1",
          name: "Exercise 1",
          vimeoToken: "123",
          description: "",
          defaultWeight: null,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "ex-3",
          name: "Exercise 3",
          vimeoToken: "456",
          description: "",
          defaultWeight: null,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      // Act
      const result = filterDuplicateExercises(existing, newExercises);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("ex-3");
    });

    it("should return all exercises if none are duplicates", () => {
      // Arrange
      const existing: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      const newExercises: ExerciseDto[] = [
        {
          id: "ex-2",
          name: "Exercise 2",
          vimeoToken: "123",
          description: "",
          defaultWeight: null,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "ex-3",
          name: "Exercise 3",
          vimeoToken: "456",
          description: "",
          defaultWeight: null,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      // Act
      const result = filterDuplicateExercises(existing, newExercises);

      // Assert
      expect(result).toHaveLength(2);
    });

    it("should return empty array if all are duplicates", () => {
      // Arrange
      const existing: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      const newExercises: ExerciseDto[] = [
        {
          id: "ex-1",
          name: "Exercise 1",
          vimeoToken: "123",
          description: "",
          defaultWeight: null,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "ex-2",
          name: "Exercise 2",
          vimeoToken: "456",
          description: "",
          defaultWeight: null,
          isHidden: false,
          tempo: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      // Act
      const result = filterDuplicateExercises(existing, newExercises);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe("validateExerciseData", () => {
    it("should validate correct exercise data", () => {
      // Arrange
      const exercise: PlanExerciseFormData = {
        exerciseId: "ex-1",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: 50,
      };

      // Act
      const result = validateExerciseData(exercise);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject missing exerciseId", () => {
      // Arrange
      const exercise: PlanExerciseFormData = {
        exerciseId: "",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: null,
      };

      // Act
      const result = validateExerciseData(exercise);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Exercise ID is required");
    });

    it("should reject sets less than 1", () => {
      // Arrange
      const exercise: PlanExerciseFormData = {
        exerciseId: "ex-1",
        sortOrder: 1,
        sets: 0,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: null,
      };

      // Act
      const result = validateExerciseData(exercise);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Sets must be between 1 and 100");
    });

    it("should reject sets greater than 100", () => {
      // Arrange
      const exercise: PlanExerciseFormData = {
        exerciseId: "ex-1",
        sortOrder: 1,
        sets: 101,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: null,
      };

      // Act
      const result = validateExerciseData(exercise);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Sets must be between 1 and 100");
    });

    it("should reject reps less than 1", () => {
      // Arrange
      const exercise: PlanExerciseFormData = {
        exerciseId: "ex-1",
        sortOrder: 1,
        sets: 3,
        reps: 0,
        tempo: "3-0-3",
        defaultWeight: null,
      };

      // Act
      const result = validateExerciseData(exercise);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Reps must be between 1 and 1000");
    });

    it("should reject reps greater than 1000", () => {
      // Arrange
      const exercise: PlanExerciseFormData = {
        exerciseId: "ex-1",
        sortOrder: 1,
        sets: 3,
        reps: 1001,
        tempo: "3-0-3",
        defaultWeight: null,
      };

      // Act
      const result = validateExerciseData(exercise);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Reps must be between 1 and 1000");
    });

    it("should reject sortOrder less than 1", () => {
      // Arrange
      const exercise: PlanExerciseFormData = {
        exerciseId: "ex-1",
        sortOrder: 0,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: null,
      };

      // Act
      const result = validateExerciseData(exercise);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Sort order must be at least 1");
    });

    it("should reject negative defaultWeight", () => {
      // Arrange
      const exercise: PlanExerciseFormData = {
        exerciseId: "ex-1",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: -5,
      };

      // Act
      const result = validateExerciseData(exercise);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Default weight cannot be negative");
    });

    it("should accept null defaultWeight", () => {
      // Arrange
      const exercise: PlanExerciseFormData = {
        exerciseId: "ex-1",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: null,
      };

      // Act
      const result = validateExerciseData(exercise);

      // Assert
      expect(result.valid).toBe(true);
    });

    it("should accumulate multiple errors", () => {
      // Arrange
      const exercise: PlanExerciseFormData = {
        exerciseId: "",
        sortOrder: 0,
        sets: 0,
        reps: 0,
        tempo: "3-0-3",
        defaultWeight: -1,
      };

      // Act
      const result = validateExerciseData(exercise);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("getExercisesToRemove", () => {
    it("should identify removed exercises", () => {
      // Arrange
      const original: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-3", sortOrder: 3, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      const updated: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-3", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = getExercisesToRemove(original, updated);

      // Assert
      expect(result).toEqual(["ex-2"]);
    });

    it("should return empty array if no exercises removed", () => {
      // Arrange
      const original: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      const updated: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 4, reps: 12, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = getExercisesToRemove(original, updated);

      // Assert
      expect(result).toEqual([]);
    });

    it("should identify multiple removed exercises", () => {
      // Arrange
      const original: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-3", sortOrder: 3, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      const updated: PlanExerciseFormData[] = [
        { exerciseId: "ex-2", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = getExercisesToRemove(original, updated);

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toContain("ex-1");
      expect(result).toContain("ex-3");
    });
  });

  describe("getExercisesToAdd", () => {
    it("should identify new exercises", () => {
      // Arrange
      const original: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      const updated: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = getExercisesToAdd(original, updated);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].exerciseId).toBe("ex-2");
    });

    it("should return empty array if no exercises added", () => {
      // Arrange
      const original: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      const updated: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 4, reps: 12, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = getExercisesToAdd(original, updated);

      // Assert
      expect(result).toEqual([]);
    });

    it("should identify multiple new exercises", () => {
      // Arrange
      const original: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      const updated: PlanExerciseFormData[] = [
        { exerciseId: "ex-1", sortOrder: 1, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-2", sortOrder: 2, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
        { exerciseId: "ex-3", sortOrder: 3, sets: 3, reps: 10, tempo: "3-0-3", defaultWeight: null },
      ];

      // Act
      const result = getExercisesToAdd(original, updated);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((ex) => ex.exerciseId)).toEqual(["ex-2", "ex-3"]);
    });
  });
});
