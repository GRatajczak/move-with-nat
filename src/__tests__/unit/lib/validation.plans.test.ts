// src/lib/validation.plans.test.ts

import { describe, it, expect } from "vitest";
import {
  planFormSchema,
  adminPlanFormSchema,
  planExerciseSchema,
  CreatePlanCommandSchema,
  UpdatePlanCommandSchema,
  TogglePlanVisibilityCommandSchema,
  ListPlansQuerySchema,
} from "../../../lib/validation";

describe("planExerciseSchema", () => {
  describe("Happy Path", () => {
    it("should accept valid exercise data", () => {
      // Arrange
      const validExercise = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: 50,
      };

      // Act
      const result = planExerciseSchema.safeParse(validExercise);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validExercise);
      }
    });

    it("should accept exercise without optional defaultWeight", () => {
      // Arrange
      const exerciseWithoutWeight = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
      };

      // Act
      const result = planExerciseSchema.safeParse(exerciseWithoutWeight);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept tempo in XXXX format", () => {
      // Arrange
      const exerciseWithXXXXTempo = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "2020",
      };

      // Act
      const result = planExerciseSchema.safeParse(exerciseWithXXXXTempo);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept tempo in X-X-X format", () => {
      // Arrange
      const exerciseWithDashedTempo = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "4-1-2",
      };

      // Act
      const result = planExerciseSchema.safeParse(exerciseWithDashedTempo);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept empty string for tempo", () => {
      // Arrange
      const exerciseWithEmptyTempo = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "",
      };

      // Act
      const result = planExerciseSchema.safeParse(exerciseWithEmptyTempo);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept defaultWeight as null", () => {
      // Arrange
      const exerciseWithNullWeight = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: null,
      };

      // Act
      const result = planExerciseSchema.safeParse(exerciseWithNullWeight);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Validation Errors", () => {
    it("should reject invalid UUID for exerciseId", () => {
      // Arrange
      const invalidExercise = {
        exerciseId: "not-a-valid-uuid",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
      };

      // Act
      const result = planExerciseSchema.safeParse(invalidExercise);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Nieprawidłowy ID ćwiczenia");
      }
    });

    it("should reject negative sortOrder", () => {
      // Arrange
      const invalidExercise = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: -1,
        sets: 3,
        reps: 10,
      };

      // Act
      const result = planExerciseSchema.safeParse(invalidExercise);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject sets less than 1", () => {
      // Arrange
      const invalidExercise = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 1,
        sets: 0,
        reps: 10,
      };

      // Act
      const result = planExerciseSchema.safeParse(invalidExercise);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Min. 1 seria");
      }
    });

    it("should reject sets greater than 100", () => {
      // Arrange
      const invalidExercise = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 1,
        sets: 101,
        reps: 10,
      };

      // Act
      const result = planExerciseSchema.safeParse(invalidExercise);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Max. 100 serii");
      }
    });

    it("should reject reps less than 1", () => {
      // Arrange
      const invalidExercise = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 1,
        sets: 3,
        reps: 0,
      };

      // Act
      const result = planExerciseSchema.safeParse(invalidExercise);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Min. 1 powtórzenie");
      }
    });

    it("should reject reps greater than 1000", () => {
      // Arrange
      const invalidExercise = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 1,
        sets: 3,
        reps: 1001,
      };

      // Act
      const result = planExerciseSchema.safeParse(invalidExercise);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Max. 1000 powtórzeń");
      }
    });

    it("should reject invalid tempo format", () => {
      // Arrange
      const invalidExercise = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "invalid-tempo",
      };

      // Act
      const result = planExerciseSchema.safeParse(invalidExercise);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Format");
      }
    });

    it("should reject negative defaultWeight", () => {
      // Arrange
      const invalidExercise = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: -5,
      };

      // Act
      const result = planExerciseSchema.safeParse(invalidExercise);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nie może być ujemny");
      }
    });
  });

  describe("Edge Cases", () => {
    it("should accept minimum valid values", () => {
      // Arrange
      const minimalExercise = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 0,
        sets: 1,
        reps: 1,
        tempo: "1-0-1",
        defaultWeight: 0,
      };

      // Act
      const result = planExerciseSchema.safeParse(minimalExercise);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept maximum valid values", () => {
      // Arrange
      const maximalExercise = {
        exerciseId: "123e4567-e89b-12d3-a456-426614174000",
        sortOrder: 999,
        sets: 100,
        reps: 1000,
        tempo: "9-9-9-9",
        defaultWeight: 999999,
      };

      // Act
      const result = planExerciseSchema.safeParse(maximalExercise);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});

describe("planFormSchema", () => {
  describe("Happy Path", () => {
    it("should accept valid plan form data", () => {
      // Arrange
      const validPlan = {
        name: "Test Plan",
        description: "A test description",
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174001",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
            defaultWeight: 50,
          },
        ],
      };

      // Act
      const result = planFormSchema.safeParse(validPlan);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should trim name and description", () => {
      // Arrange
      const planWithSpaces = {
        name: "  Test Plan  ",
        description: "  Test Description  ",
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174001",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = planFormSchema.safeParse(planWithSpaces);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test Plan");
        expect(result.data.description).toBe("Test Description");
      }
    });

    it("should accept empty string for description", () => {
      // Arrange
      const planWithEmptyDescription = {
        name: "Test Plan",
        description: "",
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174001",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = planFormSchema.safeParse(planWithEmptyDescription);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Validation Errors", () => {
    it("should reject name shorter than 3 characters", () => {
      // Arrange
      const invalidPlan = {
        name: "AB",
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174001",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = planFormSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("min. 3 znaki");
      }
    });

    it("should reject name longer than 100 characters", () => {
      // Arrange
      const invalidPlan = {
        name: "A".repeat(101),
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174001",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = planFormSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("max. 100 znaków");
      }
    });

    it("should reject description longer than 1000 characters", () => {
      // Arrange
      const invalidPlan = {
        name: "Test Plan",
        description: "A".repeat(1001),
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174001",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = planFormSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("max. 1000 znaków");
      }
    });

    it("should reject invalid clientId UUID", () => {
      // Arrange
      const invalidPlan = {
        name: "Test Plan",
        clientId: "invalid-uuid",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174001",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = planFormSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("podopiecznego");
      }
    });

    it("should reject plan with no exercises", () => {
      // Arrange
      const invalidPlan = {
        name: "Test Plan",
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        isHidden: false,
        exercises: [],
      };

      // Act
      const result = planFormSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("jedno ćwiczenie");
      }
    });

    it("should reject plan without required fields", () => {
      // Arrange
      const invalidPlan = {
        name: "Test Plan",
      };

      // Act
      const result = planFormSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should accept minimum name length (3 characters)", () => {
      // Arrange
      const plan = {
        name: "ABC",
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174001",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = planFormSchema.safeParse(plan);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept maximum name length (100 characters)", () => {
      // Arrange
      const plan = {
        name: "A".repeat(100),
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174001",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = planFormSchema.safeParse(plan);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept maximum description length (1000 characters)", () => {
      // Arrange
      const plan = {
        name: "Test Plan",
        description: "A".repeat(1000),
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174001",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = planFormSchema.safeParse(plan);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept multiple exercises", () => {
      // Arrange
      const plan = {
        name: "Test Plan",
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174001",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174002",
            sortOrder: 2,
            sets: 4,
            reps: 12,
          },
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174003",
            sortOrder: 3,
            sets: 5,
            reps: 8,
          },
        ],
      };

      // Act
      const result = planFormSchema.safeParse(plan);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exercises).toHaveLength(3);
      }
    });
  });
});

describe("adminPlanFormSchema", () => {
  describe("Happy Path", () => {
    it("should accept valid admin plan with both trainerId and clientId", () => {
      // Arrange
      const validAdminPlan = {
        name: "Admin Test Plan",
        description: "Admin description",
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        trainerId: "123e4567-e89b-12d3-a456-426614174001",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174002",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = adminPlanFormSchema.safeParse(validAdminPlan);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept empty string for optional clientId", () => {
      // Arrange
      const planWithoutClient = {
        name: "Admin Test Plan",
        clientId: "",
        trainerId: "123e4567-e89b-12d3-a456-426614174001",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174002",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = adminPlanFormSchema.safeParse(planWithoutClient);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept empty string for optional trainerId", () => {
      // Arrange
      const planWithoutTrainer = {
        name: "Admin Test Plan",
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        trainerId: "",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174002",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = adminPlanFormSchema.safeParse(planWithoutTrainer);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept plan without clientId and trainerId (unassigned plan)", () => {
      // Arrange
      const unassignedPlan = {
        name: "Unassigned Plan",
        clientId: "",
        trainerId: "",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174002",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = adminPlanFormSchema.safeParse(unassignedPlan);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Validation Errors", () => {
    it("should reject invalid trainerId UUID", () => {
      // Arrange
      const invalidPlan = {
        name: "Test Plan",
        clientId: "123e4567-e89b-12d3-a456-426614174000",
        trainerId: "not-a-uuid",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174001",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = adminPlanFormSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("trenera");
      }
    });

    it("should reject invalid clientId UUID (when not empty)", () => {
      // Arrange
      const invalidPlan = {
        name: "Test Plan",
        clientId: "not-a-uuid",
        trainerId: "123e4567-e89b-12d3-a456-426614174001",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174002",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = adminPlanFormSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("podopiecznego");
      }
    });
  });

  describe("Comparison with planFormSchema", () => {
    it("should differ from planFormSchema by making clientId optional", () => {
      // Arrange
      const planWithoutClient = {
        name: "Test Plan",
        trainerId: "123e4567-e89b-12d3-a456-426614174001",
        isHidden: false,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174002",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const adminResult = adminPlanFormSchema.safeParse(planWithoutClient);
      const trainerResult = planFormSchema.safeParse(planWithoutClient);

      // Assert - Admin schema allows missing clientId, trainer schema doesn't
      expect(adminResult.success).toBe(true);
      expect(trainerResult.success).toBe(false);
    });
  });
});

describe("CreatePlanCommandSchema", () => {
  describe("Business Rules", () => {
    it("should require at least one exercise", () => {
      // Arrange
      const planWithoutExercises = {
        name: "Test Plan",
        trainerId: "123e4567-e89b-12d3-a456-426614174000",
        clientId: "123e4567-e89b-12d3-a456-426614174001",
        isHidden: false,
        exercises: [],
      };

      // Act
      const result = CreatePlanCommandSchema.safeParse(planWithoutExercises);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one exercise");
      }
    });

    it("should set default isHidden to false", () => {
      // Arrange
      const planWithoutIsHidden = {
        name: "Test Plan",
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174000",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act
      const result = CreatePlanCommandSchema.safeParse(planWithoutIsHidden);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isHidden).toBe(false);
      }
    });

    it("should set default tempo to 3-0-3 for exercises", () => {
      // Arrange
      const planWithoutTempo = {
        name: "Test Plan",
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174000",
            sortOrder: 1,
            sets: 3,
            reps: 10,
          },
        ],
      };

      // Act
      const result = CreatePlanCommandSchema.safeParse(planWithoutTempo);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exercises[0].tempo).toBe("3-0-3");
      }
    });

    it("should allow trainerId and clientId to be null", () => {
      // Arrange
      const planWithNullIds = {
        name: "Test Plan",
        trainerId: null,
        clientId: null,
        exercises: [
          {
            exerciseId: "123e4567-e89b-12d3-a456-426614174000",
            sortOrder: 1,
            sets: 3,
            reps: 10,
            tempo: "3-0-3",
          },
        ],
      };

      // Act
      const result = CreatePlanCommandSchema.safeParse(planWithNullIds);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});

describe("UpdatePlanCommandSchema", () => {
  describe("Business Rules", () => {
    it("should require at least one field for update", () => {
      // Arrange
      const emptyUpdate = {};

      // Act
      const result = UpdatePlanCommandSchema.safeParse(emptyUpdate);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one field");
      }
    });

    it("should accept partial update with only name", () => {
      // Arrange
      const partialUpdate = {
        name: "Updated Name",
      };

      // Act
      const result = UpdatePlanCommandSchema.safeParse(partialUpdate);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept partial update with only isHidden", () => {
      // Arrange
      const partialUpdate = {
        isHidden: true,
      };

      // Act
      const result = UpdatePlanCommandSchema.safeParse(partialUpdate);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should allow setting trainerId to null (unassign trainer)", () => {
      // Arrange
      const updateWithNullTrainer = {
        trainerId: null,
      };

      // Act
      const result = UpdatePlanCommandSchema.safeParse(updateWithNullTrainer);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should allow setting clientId to null (unassign client)", () => {
      // Arrange
      const updateWithNullClient = {
        clientId: null,
      };

      // Act
      const result = UpdatePlanCommandSchema.safeParse(updateWithNullClient);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should require at least one exercise when updating exercises", () => {
      // Arrange
      const updateWithEmptyExercises = {
        exercises: [],
      };

      // Act
      const result = UpdatePlanCommandSchema.safeParse(updateWithEmptyExercises);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one exercise");
      }
    });
  });
});

describe("ListPlansQuerySchema", () => {
  describe("Query Parameter Validation", () => {
    it("should accept valid query parameters", () => {
      // Arrange
      const validQuery = {
        trainerId: "123e4567-e89b-12d3-a456-426614174000",
        clientId: "123e4567-e89b-12d3-a456-426614174001",
        visible: "true",
        page: "1",
        limit: "20",
        sortBy: "created_at",
      };

      // Act
      const result = ListPlansQuerySchema.safeParse(validQuery);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should coerce string to boolean for visible", () => {
      // Arrange
      const query = {
        visible: "true",
      };

      // Act
      const result = ListPlansQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visible).toBe(true);
        expect(typeof result.data.visible).toBe("boolean");
      }
    });

    it("should coerce string to number for page and limit", () => {
      // Arrange
      const query = {
        page: "5",
        limit: "50",
      };

      // Act
      const result = ListPlansQuerySchema.safeParse(query);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(50);
      }
    });

    it("should set default values for page, limit, and sortBy", () => {
      // Arrange
      const emptyQuery = {};

      // Act
      const result = ListPlansQuerySchema.safeParse(emptyQuery);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe("created_at");
      }
    });

    it("should reject page less than 1", () => {
      // Arrange
      const invalidQuery = {
        page: "0",
      };

      // Act
      const result = ListPlansQuerySchema.safeParse(invalidQuery);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 1");
      }
    });

    it("should reject limit greater than 100", () => {
      // Arrange
      const invalidQuery = {
        limit: "101",
      };

      // Act
      const result = ListPlansQuerySchema.safeParse(invalidQuery);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot exceed 100");
      }
    });
  });
});

describe("TogglePlanVisibilityCommandSchema", () => {
  it("should accept boolean isHidden value", () => {
    // Arrange
    const command = {
      isHidden: true,
    };

    // Act
    const result = TogglePlanVisibilityCommandSchema.safeParse(command);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject non-boolean isHidden value", () => {
    // Arrange
    const command = {
      isHidden: "true",
    };

    // Act
    const result = TogglePlanVisibilityCommandSchema.safeParse(command);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should require isHidden field", () => {
    // Arrange
    const command = {};

    // Act
    const result = TogglePlanVisibilityCommandSchema.safeParse(command);

    // Assert
    expect(result.success).toBe(false);
  });
});
