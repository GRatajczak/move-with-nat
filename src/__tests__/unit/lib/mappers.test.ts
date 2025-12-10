// src/__tests__/unit/lib/mappers.test.ts

import { describe, it, expect } from "vitest";
import {
  mapExerciseToDTO,
  mapExerciseToSummaryDTO,
  mapPlanToDTO,
  mapPlanExerciseToDTO,
  mapPlanWithExercisesToDTO,
  mapUserToDTO,
  mapUserRoleFromDTO,
  mapUserRoleToDTO,
  mapStandardReasonToDTO,
} from "../../../lib/mappers";
import type { ExerciseRow, PlanRow, PlanExerciseRow, UserRow, StandardReasonRow } from "../../../types/db";

describe("mappers", () => {
  describe("mapExerciseToDTO", () => {
    // ✅ Complete Exercise Data
    it("should map complete exercise row to DTO", () => {
      // Arrange
      const exerciseRow: ExerciseRow = {
        id: "exercise-123",
        name: "Bench Press",
        description: "Chest exercise",
        vimeo_token: "987654321",
        default_weight: 80,
        is_hidden: false,
        tempo: "3-0-3",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapExerciseToDTO(exerciseRow);

      // Assert
      expect(result).toEqual({
        id: "exercise-123",
        name: "Bench Press",
        description: "Chest exercise",
        vimeoToken: "987654321",
        defaultWeight: 80,
        isHidden: false,
        tempo: "3-0-3",
        createdAt: "2024-01-01T00:00:00Z",
      });
    });

    // ✅ Null/Nullable Fields
    it("should handle null values correctly", () => {
      // Arrange
      const exerciseRow: ExerciseRow = {
        id: "exercise-456",
        name: "Bodyweight Squat",
        description: null,
        vimeo_token: "123456789",
        default_weight: null,
        is_hidden: false,
        tempo: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapExerciseToDTO(exerciseRow);

      // Assert
      expect(result.defaultWeight).toBeNull();
      expect(result.description).toBeNull();
      expect(result.tempo).toBeNull();
    });

    // ✅ Field Name Transformations
    it("should correctly transform snake_case to camelCase", () => {
      // Arrange
      const exerciseRow: ExerciseRow = {
        id: "ex-1",
        name: "Test",
        description: "Test desc",
        vimeo_token: "token123",
        default_weight: 50,
        is_hidden: true,
        tempo: "2-0-2",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapExerciseToDTO(exerciseRow);

      // Assert
      expect(result).toHaveProperty("vimeoToken");
      expect(result).toHaveProperty("defaultWeight");
      expect(result).toHaveProperty("isHidden");
      expect(result).toHaveProperty("createdAt");
      expect(result).not.toHaveProperty("vimeo_token");
      expect(result).not.toHaveProperty("default_weight");
      expect(result).not.toHaveProperty("is_hidden");
      expect(result).not.toHaveProperty("created_at");
    });
  });

  describe("mapExerciseToSummaryDTO", () => {
    // ✅ Summary Mapping
    it("should map only summary fields", () => {
      // Arrange
      const exerciseRow: ExerciseRow = {
        id: "exercise-123",
        name: "Pull-up",
        description: "Back exercise",
        vimeo_token: "token",
        default_weight: 0,
        is_hidden: false,
        tempo: "3-0-3",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapExerciseToSummaryDTO(exerciseRow);

      // Assert
      expect(result).toEqual({
        id: "exercise-123",
        name: "Pull-up",
        defaultWeight: 0,
      });
      expect(result).not.toHaveProperty("description");
      expect(result).not.toHaveProperty("vimeoToken");
      expect(result).not.toHaveProperty("createdAt");
    });

    it("should handle null defaultWeight in summary", () => {
      // Arrange
      const exerciseRow: ExerciseRow = {
        id: "ex-1",
        name: "Plank",
        description: "",
        vimeo_token: "token",
        default_weight: null,
        is_hidden: false,
        tempo: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapExerciseToSummaryDTO(exerciseRow);

      // Assert
      expect(result.defaultWeight).toBeNull();
    });
  });

  describe("mapPlanToDTO", () => {
    // ✅ Plan Without Client Data
    it("should map plan without client data", () => {
      // Arrange
      const planRow: PlanRow = {
        id: "plan-123",
        name: "Strength Training",
        description: "Basic strength program",
        client_id: null,
        trainer_id: "trainer-123",
        is_hidden: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapPlanToDTO(planRow);

      // Assert
      expect(result).toEqual({
        id: "plan-123",
        name: "Strength Training",
        description: "Basic strength program",
        clientId: null,
        clientName: null,
        trainerId: "trainer-123",
        isHidden: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        exercises: [],
      });
    });

    // ✅ Plan With Client Data
    it("should map plan with client data", () => {
      // Arrange
      const planRow: PlanRow = {
        id: "plan-123",
        name: "Custom Plan",
        description: null,
        client_id: "client-456",
        trainer_id: "trainer-123",
        is_hidden: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const clientData = {
        first_name: "John",
        last_name: "Doe",
      };

      // Act
      const result = mapPlanToDTO(planRow, clientData);

      // Assert
      expect(result.clientId).toBe("client-456");
      expect(result.clientName).toBe("John Doe");
    });

    it("should handle client with only first name", () => {
      // Arrange
      const planRow: PlanRow = {
        id: "plan-123",
        name: "Plan",
        description: null,
        client_id: "client-456",
        trainer_id: "trainer-123",
        is_hidden: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const clientData = {
        first_name: "John",
        last_name: null,
      };

      // Act
      const result = mapPlanToDTO(planRow, clientData);

      // Assert
      expect(result.clientName).toBe("John");
    });

    it("should handle client with only last name", () => {
      // Arrange
      const planRow: PlanRow = {
        id: "plan-123",
        name: "Plan",
        description: null,
        client_id: "client-456",
        trainer_id: "trainer-123",
        is_hidden: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const clientData = {
        first_name: null,
        last_name: "Doe",
      };

      // Act
      const result = mapPlanToDTO(planRow, clientData);

      // Assert
      expect(result.clientName).toBe("Doe");
    });

    it("should handle null client data", () => {
      // Arrange
      const planRow: PlanRow = {
        id: "plan-123",
        name: "Plan",
        description: null,
        client_id: "client-456",
        trainer_id: "trainer-123",
        is_hidden: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapPlanToDTO(planRow, null);

      // Assert
      expect(result.clientName).toBeNull();
    });

    it("should handle empty client names", () => {
      // Arrange
      const planRow: PlanRow = {
        id: "plan-123",
        name: "Plan",
        description: null,
        client_id: "client-456",
        trainer_id: "trainer-123",
        is_hidden: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const clientData = {
        first_name: null,
        last_name: null,
      };

      // Act
      const result = mapPlanToDTO(planRow, clientData);

      // Assert
      expect(result.clientName).toBeNull();
    });

    // ✅ Always Empty Exercises Array
    it("should always return empty exercises array", () => {
      // Arrange
      const planRow: PlanRow = {
        id: "plan-123",
        name: "Plan",
        description: null,
        client_id: null,
        trainer_id: null,
        is_hidden: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapPlanToDTO(planRow);

      // Assert
      expect(result.exercises).toEqual([]);
      expect(Array.isArray(result.exercises)).toBe(true);
    });
  });

  describe("mapPlanExerciseToDTO", () => {
    // ✅ Plan Exercise Without Nested Exercise
    it("should map plan exercise without nested exercise data", () => {
      // Arrange
      const planExerciseRow: PlanExerciseRow = {
        id: "pe-123",
        plan_id: "plan-123",
        exercise_id: "exercise-456",
        exercise_order: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
        default_weight: 50,
        is_completed: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        custom_reason: null,
        reason_id: null,
      };

      // Act
      const result = mapPlanExerciseToDTO(planExerciseRow);

      // Assert
      expect(result).toEqual({
        id: "pe-123",
        exerciseId: "exercise-456",
        sortOrder: 1,
        sets: 3,
        reps: 10,
        tempo: "3-0-3",
        defaultWeight: 50,
      });
      expect(result).not.toHaveProperty("exercise");
    });

    // ✅ Plan Exercise With Nested Exercise
    it("should map plan exercise with nested exercise data", () => {
      // Arrange
      const planExerciseRow: PlanExerciseRow & { exercise: ExerciseRow } = {
        id: "pe-123",
        plan_id: "plan-123",
        exercise_id: "exercise-456",
        exercise_order: 2,
        sets: 4,
        reps: 8,
        tempo: "2-0-2",
        default_weight: 60,
        is_completed: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        reason_id: null,
        custom_reason: null,
        exercise: {
          id: "exercise-456",
          name: "Squat",
          description: "Leg exercise",
          vimeo_token: "token123",
          default_weight: 60,
          is_hidden: false,
          tempo: "2-0-2",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      };

      // Act
      const result = mapPlanExerciseToDTO(planExerciseRow);

      // Assert
      expect(result.exercise).toBeDefined();
      expect(result.exercise?.name).toBe("Squat");
      expect(result.exercise?.vimeoToken).toBe("token123");
    });

    // ✅ Null/Zero Values
    it("should handle zero values for sets and reps", () => {
      // Arrange
      const planExerciseRow: PlanExerciseRow = {
        id: "pe-123",
        plan_id: "plan-123",
        exercise_id: "exercise-456",
        exercise_order: 1,
        sets: 0,
        reps: 0,
        tempo: "3-0-3",
        default_weight: null,
        is_completed: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        reason_id: null,
        custom_reason: null,
      };

      // Act
      const result = mapPlanExerciseToDTO(planExerciseRow);

      // Assert
      expect(result.sets).toBe(0);
      expect(result.reps).toBe(0);
      expect(result.defaultWeight).toBeNull();
    });
  });

  describe("mapPlanWithExercisesToDTO", () => {
    // ✅ Complete Plan With Exercises
    it("should map plan with exercises", () => {
      // Arrange
      const planRow: PlanRow = {
        id: "plan-123",
        name: "Full Program",
        description: "Complete workout",
        client_id: "client-456",
        trainer_id: "trainer-123",
        is_hidden: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const planExercises: PlanExerciseRow[] = [
        {
          id: "pe-1",
          plan_id: "plan-123",
          exercise_id: "ex-1",
          exercise_order: 1,
          sets: 3,
          reps: 10,
          tempo: "3-0-3",
          default_weight: 50,
          is_completed: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          reason_id: null,
          custom_reason: null,
        },
        {
          id: "pe-2",
          plan_id: "plan-123",
          exercise_id: "ex-2",
          exercise_order: 2,
          sets: 4,
          reps: 8,
          tempo: "2-0-2",
          default_weight: 60,
          is_completed: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          reason_id: null,
          custom_reason: null,
        },
      ];

      const clientData = {
        first_name: "John",
        last_name: "Doe",
      };

      // Act
      const result = mapPlanWithExercisesToDTO(planRow, planExercises, clientData);

      // Assert
      expect(result.id).toBe("plan-123");
      expect(result.name).toBe("Full Program");
      expect(result.clientName).toBe("John Doe");
      expect(result.exercises).toHaveLength(2);
      expect(result.exercises[0].sortOrder).toBe(1);
      expect(result.exercises[1].sortOrder).toBe(2);
    });

    it("should handle empty exercises array", () => {
      // Arrange
      const planRow: PlanRow = {
        id: "plan-123",
        name: "Empty Plan",
        description: null,
        client_id: null,
        trainer_id: null,
        is_hidden: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapPlanWithExercisesToDTO(planRow, []);

      // Assert
      expect(result.exercises).toEqual([]);
    });
  });

  describe("mapUserToDTO", () => {
    // ✅ Complete User Data
    it("should map complete user row to DTO", () => {
      // Arrange
      const userRow: UserRow = {
        id: "user-123",
        email: "user@test.com",
        role: "trainer",
        status: "active",
        first_name: "John",
        last_name: "Doe",
        phone: "+48123456789",
        date_of_birth: "1990-05-15",
        trainer_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapUserToDTO(userRow);

      // Assert
      expect(result).toEqual({
        id: "user-123",
        email: "user@test.com",
        role: "trainer",
        status: "active",
        firstName: "John",
        lastName: "Doe",
        phone: "+48123456789",
        dateOfBirth: "1990-05-15",
        trainerId: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      });
    });

    // ✅ Client With Trainer
    it("should map client with trainerId", () => {
      // Arrange
      const userRow: UserRow = {
        id: "client-123",
        email: "client@test.com",
        role: "client",
        status: "active",
        first_name: "Jane",
        last_name: "Smith",
        phone: null,
        date_of_birth: null,
        trainer_id: "trainer-456",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapUserToDTO(userRow);

      // Assert
      expect(result.trainerId).toBe("trainer-456");
      expect(result.role).toBe("client");
    });

    // ✅ Null Optional Fields
    it("should handle null optional fields", () => {
      // Arrange
      const userRow: UserRow = {
        id: "user-123",
        email: "minimal@test.com",
        role: "admin",
        status: "pending",
        first_name: "Admin",
        last_name: "User",
        phone: null,
        date_of_birth: null,
        trainer_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapUserToDTO(userRow);

      // Assert
      expect(result.phone).toBeNull();
      expect(result.dateOfBirth).toBeNull();
      expect(result.trainerId).toBeNull();
    });

    // ✅ Different Roles
    it("should correctly map all user roles", () => {
      // Arrange
      const roles = ["admin", "trainer", "client"] as const;

      // Act & Assert
      roles.forEach((role) => {
        const userRow: UserRow = {
          id: `${role}-123`,
          email: `${role}@test.com`,
          role,
          status: "active",
          first_name: role.charAt(0).toUpperCase() + role.slice(1),
          last_name: "User",
          phone: null,
          date_of_birth: null,
          trainer_id: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        };

        const result = mapUserToDTO(userRow);
        expect(result.role).toBe(role);
      });
    });

    // ✅ Different Statuses
    it("should correctly map all user statuses", () => {
      // Arrange
      const statuses = ["pending", "active", "suspended"] as const;

      // Act & Assert
      statuses.forEach((status) => {
        const userRow: UserRow = {
          id: "user-123",
          email: "user@test.com",
          role: "trainer",
          status,
          first_name: "Test",
          last_name: "User",
          phone: null,
          date_of_birth: null,
          trainer_id: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        };

        const result = mapUserToDTO(userRow);
        expect(result.status).toBe(status);
      });
    });
  });

  describe("mapUserRoleFromDTO and mapUserRoleToDTO", () => {
    // ✅ Bidirectional Mapping
    it("should correctly map roles from DTO to DB and back", () => {
      // Arrange
      const roles = ["admin", "trainer", "client"] as const;

      // Act & Assert
      roles.forEach((role) => {
        const dbRole = mapUserRoleFromDTO(role);
        const dtoRole = mapUserRoleToDTO(dbRole);

        expect(dtoRole).toBe(role);
        expect(dbRole).toBe(role); // In this case they're 1:1
      });
    });
  });

  describe("mapStandardReasonToDTO", () => {
    // ✅ Complete Reason Mapping
    it("should map standard reason to DTO", () => {
      // Arrange
      const reasonRow: StandardReasonRow = {
        id: "reason-123",
        code: "injury",
        label: "Injury or pain",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Act
      const result = mapStandardReasonToDTO(reasonRow);

      // Assert
      expect(result).toEqual({
        id: "reason-123",
        code: "injury",
        label: "Injury or pain",
      });
      expect(result).not.toHaveProperty("created_at");
      expect(result).not.toHaveProperty("updated_at");
    });
  });
});
