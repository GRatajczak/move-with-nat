// src/__tests__/unit/lib/validation.exercises.test.ts

import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import {
  AddPlanExerciseCommandSchema,
  UpdatePlanExerciseCommandSchema,
  MarkCompletionCommandSchema,
  CreateReasonCommandSchema,
  UpdateReasonCommandSchema,
} from "../../../lib/validation";

describe("validation.exercises", () => {
  describe("AddPlanExerciseCommandSchema", () => {
    it("should accept valid exercise data", () => {
      // Arrange
      const data = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: 50,
      };

      // Act
      const result = AddPlanExerciseCommandSchema.parse(data);

      // Assert
      expect(result.exerciseId).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(result.sortOrder).toBe(1);
      expect(result.sets).toBe(3);
      expect(result.reps).toBe(10);
    });

    it("should set default tempo to 3-0-3", () => {
      // Arrange
      const data = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
      };

      // Act
      const result = AddPlanExerciseCommandSchema.parse(data);

      // Assert
      expect(result.tempo).toBe("3-0-3");
    });

    it("should accept tempo in XXXX format", () => {
      // Arrange
      const data = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "2020",
      };

      // Act
      const result = AddPlanExerciseCommandSchema.parse(data);

      // Assert
      expect(result.tempo).toBe("2020");
    });

    it("should accept tempo in X-X-X format", () => {
      // Arrange
      const data = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "4-1-2",
      };

      // Act
      const result = AddPlanExerciseCommandSchema.parse(data);

      // Assert
      expect(result.tempo).toBe("4-1-2");
    });

    it("should accept tempo in X-X-X-X format", () => {
      // Arrange
      const data = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3-0",
      };

      // Act
      const result = AddPlanExerciseCommandSchema.parse(data);

      // Assert
      expect(result.tempo).toBe("3-0-3-0");
    });

    it("should reject invalid UUID", () => {
      // Arrange
      const data = {
        exerciseId: "invalid-uuid",
        sortOrder: 1,
        sets: 3,
        reps: 10,
      };

      // Act & Assert
      expect(() => AddPlanExerciseCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject sortOrder less than 1", () => {
      // Arrange
      const data = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        sortOrder: 0,
        sets: 3,
        reps: 10,
      };

      // Act & Assert
      expect(() => AddPlanExerciseCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject sets less than 1", () => {
      // Arrange
      const data = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        sortOrder: 1,
        sets: 0,
        reps: 10,
      };

      // Act & Assert
      expect(() => AddPlanExerciseCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject reps less than 1", () => {
      // Arrange
      const data = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        sortOrder: 1,
        sets: 3,
        reps: 0,
      };

      // Act & Assert
      expect(() => AddPlanExerciseCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject negative weight", () => {
      // Arrange
      const data = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        defaultWeight: -10,
      };

      // Act & Assert
      expect(() => AddPlanExerciseCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should accept null for defaultWeight", () => {
      // Arrange
      const data = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        defaultWeight: null,
      };

      // Act
      const result = AddPlanExerciseCommandSchema.parse(data);

      // Assert
      expect(result.defaultWeight).toBeNull();
    });

    it("should reject invalid tempo format", () => {
      // Arrange
      const data = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "invalid",
      };

      // Act & Assert
      expect(() => AddPlanExerciseCommandSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("UpdatePlanExerciseCommandSchema", () => {
    it("should accept partial update with only sortOrder", () => {
      // Arrange
      const data = { sortOrder: 2 };

      // Act
      const result = UpdatePlanExerciseCommandSchema.parse(data);

      // Assert
      expect(result.sortOrder).toBe(2);
    });

    it("should accept partial update with only sets", () => {
      // Arrange
      const data = { sets: 4 };

      // Act
      const result = UpdatePlanExerciseCommandSchema.parse(data);

      // Assert
      expect(result.sets).toBe(4);
    });

    it("should accept partial update with only reps", () => {
      // Arrange
      const data = { reps: 12 };

      // Act
      const result = UpdatePlanExerciseCommandSchema.parse(data);

      // Assert
      expect(result.reps).toBe(12);
    });

    it("should accept partial update with only tempo", () => {
      // Arrange
      const data = { tempo: "4-0-4" };

      // Act
      const result = UpdatePlanExerciseCommandSchema.parse(data);

      // Assert
      expect(result.tempo).toBe("4-0-4");
    });

    it("should reject empty update", () => {
      // Arrange
      const data = {};

      // Act & Assert
      expect(() => UpdatePlanExerciseCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should accept null for defaultWeight", () => {
      // Arrange
      const data = { defaultWeight: null };

      // Act
      const result = UpdatePlanExerciseCommandSchema.parse(data);

      // Assert
      expect(result.defaultWeight).toBeNull();
    });

    it("should accept multiple fields", () => {
      // Arrange
      const data = {
        sets: 4,
        reps: 8,
        tempo: "2-0-2",
      };

      // Act
      const result = UpdatePlanExerciseCommandSchema.parse(data);

      // Assert
      expect(result.sets).toBe(4);
      expect(result.reps).toBe(8);
      expect(result.tempo).toBe("2-0-2");
    });
  });

  describe("MarkCompletionCommandSchema", () => {
    it("should accept completed=true without reason", () => {
      // Arrange
      const data = {
        completed: true,
      };

      // Act
      const result = MarkCompletionCommandSchema.parse(data);

      // Assert
      expect(result.completed).toBe(true);
    });

    it("should accept completed=false with reasonId", () => {
      // Arrange
      const data = {
        completed: false,
        reasonId: "550e8400-e29b-41d4-a716-446655440000",
      };

      // Act
      const result = MarkCompletionCommandSchema.parse(data);

      // Assert
      expect(result.completed).toBe(false);
      expect(result.reasonId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should accept completed=false with customReason", () => {
      // Arrange
      const data = {
        completed: false,
        customReason: "Too tired today",
      };

      // Act
      const result = MarkCompletionCommandSchema.parse(data);

      // Assert
      expect(result.completed).toBe(false);
      expect(result.customReason).toBe("Too tired today");
    });

    it("should accept completed=false with both reasonId and customReason", () => {
      // Arrange
      const data = {
        completed: false,
        reasonId: "550e8400-e29b-41d4-a716-446655440000",
        customReason: "Additional notes",
      };

      // Act
      const result = MarkCompletionCommandSchema.parse(data);

      // Assert
      expect(result.completed).toBe(false);
      expect(result.reasonId).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(result.customReason).toBe("Additional notes");
    });

    it("should reject completed=false without reason", () => {
      // Arrange
      const data = {
        completed: false,
      };

      // Act & Assert
      expect(() => MarkCompletionCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject customReason longer than 500 characters", () => {
      // Arrange
      const data = {
        completed: false,
        customReason: "A".repeat(501),
      };

      // Act & Assert
      expect(() => MarkCompletionCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject invalid UUID for reasonId", () => {
      // Arrange
      const data = {
        completed: false,
        reasonId: "invalid-uuid",
      };

      // Act & Assert
      expect(() => MarkCompletionCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should accept completed=true with optional reason (ignored)", () => {
      // Arrange
      const data = {
        completed: true,
        reasonId: "550e8400-e29b-41d4-a716-446655440000",
      };

      // Act
      const result = MarkCompletionCommandSchema.parse(data);

      // Assert
      expect(result.completed).toBe(true);
      expect(result.reasonId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });
  });

  describe("CreateReasonCommandSchema", () => {
    it("should accept valid reason data", () => {
      // Arrange
      const data = {
        code: "too_tired",
        label: "Too Tired",
      };

      // Act
      const result = CreateReasonCommandSchema.parse(data);

      // Assert
      expect(result.code).toBe("too_tired");
      expect(result.label).toBe("Too Tired");
    });

    it("should accept lowercase code with underscores", () => {
      // Arrange
      const data = {
        code: "too_tired",
        label: "Too Tired",
      };

      // Act
      const result = CreateReasonCommandSchema.parse(data);

      // Assert
      expect(result.code).toBe("too_tired");
    });

    it("should trim label", () => {
      // Arrange
      const data = {
        code: "test_code",
        label: "  Test Label  ",
      };

      // Act
      const result = CreateReasonCommandSchema.parse(data);

      // Assert
      expect(result.label).toBe("Test Label");
    });

    it("should reject code with uppercase and special characters", () => {
      // Arrange
      const data = {
        code: "Invalid-Code!",
        label: "Label",
      };

      // Act & Assert
      expect(() => CreateReasonCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should accept code with numbers", () => {
      // Arrange
      const data = {
        code: "reason_123",
        label: "Reason with numbers",
      };

      // Act
      const result = CreateReasonCommandSchema.parse(data);

      // Assert
      expect(result.code).toBe("reason_123");
    });

    it("should reject code shorter than 3 characters", () => {
      // Arrange
      const data = {
        code: "ab",
        label: "Label",
      };

      // Act & Assert
      expect(() => CreateReasonCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject code longer than 50 characters", () => {
      // Arrange
      const data = {
        code: "a".repeat(51),
        label: "Label",
      };

      // Act & Assert
      expect(() => CreateReasonCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject label shorter than 3 characters", () => {
      // Arrange
      const data = {
        code: "test",
        label: "AB",
      };

      // Act & Assert
      expect(() => CreateReasonCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject label longer than 200 characters", () => {
      // Arrange
      const data = {
        code: "test",
        label: "A".repeat(201),
      };

      // Act & Assert
      expect(() => CreateReasonCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should accept minimum length values", () => {
      // Arrange
      const data = {
        code: "abc",
        label: "Lab",
      };

      // Act
      const result = CreateReasonCommandSchema.parse(data);

      // Assert
      expect(result.code).toBe("abc");
      expect(result.label).toBe("Lab");
    });
  });

  describe("UpdateReasonCommandSchema", () => {
    it("should accept partial update with only code", () => {
      // Arrange
      const data = { code: "new_code" };

      // Act
      const result = UpdateReasonCommandSchema.parse(data);

      // Assert
      expect(result.code).toBe("new_code");
    });

    it("should accept partial update with only label", () => {
      // Arrange
      const data = { label: "New Label" };

      // Act
      const result = UpdateReasonCommandSchema.parse(data);

      // Assert
      expect(result.label).toBe("New Label");
    });

    it("should accept update with both fields", () => {
      // Arrange
      const data = {
        code: "updated_code",
        label: "Updated Label",
      };

      // Act
      const result = UpdateReasonCommandSchema.parse(data);

      // Assert
      expect(result.code).toBe("updated_code");
      expect(result.label).toBe("Updated Label");
    });

    it("should reject empty update", () => {
      // Arrange
      const data = {};

      // Act & Assert
      expect(() => UpdateReasonCommandSchema.parse(data)).toThrow(ZodError);
    });

    it("should accept lowercase code", () => {
      // Arrange
      const data = { code: "lower_case" };

      // Act
      const result = UpdateReasonCommandSchema.parse(data);

      // Assert
      expect(result.code).toBe("lower_case");
    });

    it("should trim label", () => {
      // Arrange
      const data = { label: "  Trimmed Label  " };

      // Act
      const result = UpdateReasonCommandSchema.parse(data);

      // Assert
      expect(result.label).toBe("Trimmed Label");
    });

    it("should reject invalid code format", () => {
      // Arrange
      const data = { code: "Invalid Code!" };

      // Act & Assert
      expect(() => UpdateReasonCommandSchema.parse(data)).toThrow(ZodError);
    });
  });
});
